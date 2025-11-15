/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (me@crujera.net)

    This program is free software: you can redistribute it and/or modify  
    it under the terms of the GNU Affero General Public License as published by  
    the Free Software Foundation, either version 3 of the License, or  
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,  
    but WITHOUT ANY WARRANTY; without even the implied warranty of  
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License  
    along with this program. If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/

async function fetchVersionRelease() {
    const versionElement = document.getElementById('currentVersion');
    if (!versionElement) {
        console.error('Version element not found');
        return;
    }

    const version = versionElement.dataset.version;
    const releaseNotesElement = document.getElementById('releaseNotes');
    const releaseVersionElement = document.getElementById('releaseVersion');

    if (!releaseNotesElement || !releaseVersionElement) {
        console.error('Required elements not found');
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/Crujera27/logitools/releases/tags/v${version}`);
        const data = await response.json();
        
        if (response.ok) {
            releaseNotesElement.innerHTML = data.body ? 
                marked.parse(data.body) : 
                `<div class="alert alert-info">
                    <h4 class="alert-heading">${data.name || `Version ${version}`}</h4>
                    <p>No detailed release notes available for this version.</p>
                    <hr>
                    <p class="mb-0">Published: ${new Date(data.published_at).toLocaleDateString()}</p>
                </div>`;
            releaseVersionElement.href = data.html_url;
        } else {
            throw new Error(`GitHub API error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        releaseNotesElement.innerHTML = 
            '<div class="alert alert-warning">Unable to load release notes for version ' + version + '</div>';
    }
}

// Ensure DOM is fully loaded before running
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchVersionRelease);
} else {
    fetchVersionRelease();
}