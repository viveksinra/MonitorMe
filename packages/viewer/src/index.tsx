import { discoverAgents, type DiscoveredAgent } from './discovery';

const root = document.getElementById('root')!;

const container = document.createElement('div');
container.style.padding = '20px';
container.style.fontFamily = 'sans-serif';

const title = document.createElement('h1');
title.textContent = 'MonitorMe Viewer';
container.appendChild(title);

const desc = document.createElement('p');
desc.textContent = 'Discovering agents on LAN via mDNS...';
container.appendChild(desc);

const list = document.createElement('ul');
container.appendChild(list);

root.innerHTML = '';
root.appendChild(container);

function renderAgents(agents: DiscoveredAgent[]) {
  list.innerHTML = '';
  if (agents.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No agents found yet';
    list.appendChild(li);
    return;
  }
  for (const a of agents) {
    const li = document.createElement('li');
    li.textContent = `${a.deviceId ?? 'unknown'} @ ${a.host}:${a.port}`;
    list.appendChild(li);
  }
}

discoverAgents(renderAgents);


