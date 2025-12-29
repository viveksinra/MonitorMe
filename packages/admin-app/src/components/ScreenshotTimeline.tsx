import { useState, useEffect } from 'react';
import type { ScreenshotMetadata, ServerConfig } from '@monitor-me/shared';

interface ScreenshotTimelineProps {
  machineId: string;
  userName: string;
  serverConfig: ServerConfig;
  onClose: () => void;
}

export default function ScreenshotTimeline({
  machineId,
  userName,
  serverConfig,
  onClose,
}: ScreenshotTimelineProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotMetadata | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  const serverUrl = `http://${serverConfig.host}:${serverConfig.port}`;

  useEffect(() => {
    loadScreenshots();
  }, [machineId, dateFilter]);

  const loadScreenshots = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `${serverUrl}/api/screenshots?machineId=${encodeURIComponent(machineId)}`;

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);

        url += `&startDate=${startDate.toISOString()}`;
        url += `&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load screenshots');
      }

      const data = await response.json();
      setScreenshots(data.screenshots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screenshots');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (screenshot: ScreenshotMetadata) => {
    return `${serverUrl}/api/screenshots/image/${screenshot.machineId}/${screenshot.filename}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupScreenshotsByDate = () => {
    const groups: { [date: string]: ScreenshotMetadata[] } = {};

    screenshots.forEach((screenshot) => {
      const date = new Date(screenshot.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(screenshot);
    });

    return groups;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Screenshot Timeline</h2>
            <p className="text-gray-600">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600">Filter by date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Clear filter
              </button>
            )}
            <button
              onClick={loadScreenshots}
              className="ml-auto px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button onClick={loadScreenshots} className="mt-4 btn-primary">
                Retry
              </button>
            </div>
          ) : screenshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No screenshots found</h3>
              <p className="text-gray-600">
                {dateFilter
                  ? 'No screenshots for the selected date'
                  : 'Screenshots will appear here once the user starts monitoring'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupScreenshotsByDate()).map(([date, dayScreenshots]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">{date}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {dayScreenshots.map((screenshot) => (
                      <div
                        key={screenshot.id}
                        className="group cursor-pointer"
                        onClick={() => setSelectedScreenshot(screenshot)}
                      >
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-primary-500 transition-colors">
                          <img
                            src={getImageUrl(screenshot)}
                            alt={`Screenshot at ${formatTime(screenshot.timestamp)}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {new Date(screenshot.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(screenshot.fileSize)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-size viewer modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedScreenshot(null);
              }}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={getImageUrl(selectedScreenshot)}
              alt={`Screenshot at ${formatTime(selectedScreenshot.timestamp)}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-center mt-4">
              {formatTime(selectedScreenshot.timestamp)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
