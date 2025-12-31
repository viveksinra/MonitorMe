import { useState, useEffect, useRef } from 'react';

interface LiveViewModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function LiveViewModal({ userId, userName, onClose }: LiveViewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [error, setError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const ensurePeerConnection = (): RTCPeerConnection => {
      if (peerConnectionRef.current) return peerConnectionRef.current;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          window.electronAPI.sendWebRTCIceCandidate(userId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      pc.ontrack = (event) => {
        if (isCancelled) return;
        const stream = event.streams?.[0];
        if (stream && videoRef.current) {
          remoteStreamRef.current = stream;
          videoRef.current.srcObject = stream;
          setConnectionState('connected');
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        const pc = ensurePeerConnection();
        setConnectionState('connecting');

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await window.electronAPI.sendWebRTCAnswer(userId, answer);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    };

    const handleIce = async (candidate: RTCIceCandidateInit) => {
      try {
        const pc = ensurePeerConnection();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // ICE candidates can arrive early; ignore add failures until remote description is set
      }
    };

    // Consume any buffered signaling that arrived before modal mounted (prevents race where offer arrives before view:accepted)
    window.electronAPI.consumePendingWebRTC(userId).then((pending) => {
      if (isCancelled) return;
      if (pending.offer) {
        handleOffer(pending.offer);
      }
      if (pending.ice?.length) {
        pending.ice.forEach((c) => void handleIce(c));
      }
    });

    // Also listen for live signaling events
    const unsubscribeOffer = window.electronAPI.onWebRTCOffer((data) => {
      if (data.userId === userId) {
        void handleOffer(data.offer);
      }
    });

    const unsubscribeIce = window.electronAPI.onWebRTCIceCandidate((data) => {
      if (data.userId === userId) {
        void handleIce(data.candidate);
      }
    });

    const unsubscribeStateChange = window.electronAPI.onWebRTCStateChange((data) => {
      if (data.userId === userId) {
        setConnectionState(data.state);
      }
    });

    const unsubscribeError = window.electronAPI.onWebRTCError((data) => {
      if (data.userId === userId) {
        setError(data.error);
      }
    });

    const unsubscribeViewEnded = window.electronAPI.onViewEnded(() => {
      onClose();
    });

    return () => {
      isCancelled = true;
      unsubscribeOffer();
      unsubscribeIce();
      unsubscribeStateChange();
      unsubscribeError();
      unsubscribeViewEnded();

      // Cleanup peer connection + stream
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, [userId, onClose]);

  const handleEndSession = () => {
    window.electronAPI.endViewSession(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full flex flex-col p-4">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Live View - {userName}</h2>
            <p className="text-sm text-gray-400">
              Status: <span className="capitalize">{connectionState}</span>
            </p>
          </div>
          <button
            onClick={handleEndSession}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            End Session
          </button>
        </div>

        {/* Video Container */}
        <div className="flex-1 bg-black rounded-b-lg flex items-center justify-center">
          {error ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-white text-lg mb-2">Connection Error</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button onClick={handleEndSession} className="mt-4 bg-gray-700 text-white px-4 py-2 rounded">
                Close
              </button>
            </div>
          ) : connectionState === 'connected' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-white text-lg">Connecting to {userName}...</p>
              <p className="text-gray-400 text-sm mt-2">Waiting for screen stream</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
