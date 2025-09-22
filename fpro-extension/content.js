// FantasyPros Data Extractor for Firefox
console.log('FantasyPros Data Extractor loaded');

function extractPlayersData() {
    console.log('Starting data extraction...');
    const players = [];
    const rows = document.querySelectorAll('tr.player-row');
    
    console.log(`Found ${rows.length} player rows`);

    const isQB = window.location.href.toLowerCase().includes('/qb.php');
    
    rows.forEach((row, index) => {
        try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 11) {
                console.log(`Row ${index} has only ${cells.length} cells, skipping`);
                return;
            }

            const rank = parseInt(cells[0].textContent.trim());
            const playerLink = cells[2].querySelector('.player-cell-name');
            const teamSpan = cells[2].querySelector('.player-cell-team');
            
            if (!playerLink) {
                console.log(`No player link found in row ${index}`);
                return;
            }

            const playerName = playerLink.textContent.trim();
            const team = teamSpan ? teamSpan.textContent.replace(/[()]/g, '') : '';

            const position = isQB ? 'QB' : cells[3].textContent.trim().replace(/\d+/g, '');
            
            const opponent = isQB ? cells[3].textContent.trim() : cells[4].textContent.trim();
            
            const upside = isQB ? cells[4].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : cells[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            const bust = isQB ? cells[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : cells[6].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            const matchup = isQB ? cells[6].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length : cells[7].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length;

            const startSit = isQB ? cells[7].textContent.trim(): '';
            
            const projFpts = isQB ? cells[8].textContent.trim(): '';
            
            const avgDiff = isQB ? cells[9]?.textContent.trim() || '' : cells[8]?.textContent.trim() || '';
            const percentOver = isQB ? cells[10]?.textContent.trim() || '' :cells[9]?.textContent.trim() || '';
            const opportunity = isQB ? cells[11]?.textContent.trim() || '' :cells[10]?.textContent.trim() || '';
            const efficiency = isQB ? cells[12]?.textContent.trim() || '' :cells[11]?.textContent.trim() || '';

            players.push({
                rank: rank,
                player_name: playerName,
                position: position,
                team: team,
                opponent: opponent,
                upside: upside,
                bust: bust,
                matchup: matchup,
                start_sit: startSit,
                proj_fpts: projFpts,
                avgDiff: avgDiff,
                percentOver: percentOver,
                opportunity: opportunity,
                efficiency: efficiency
            });
            
            if (index < 3) {
                console.log(`Parsed player ${index + 1}:`, {
                    rank, playerName, position, team, opponent, upside, bust, matchup
                });
            }
            
        } catch (error) {
            console.error(`Error parsing row ${index}:`, error);
        }
    });
    
    console.log(`Extraction complete. Found ${players.length} players.`);
    return players;
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractData") {
        const data = extractPlayersData();
        sendResponse({success: true, data: data, count: data.length});
    }
});

// Auto-inject extraction button
function injectExtractionButton() {
    // Remove existing button if present
    const existingBtn = document.querySelector('#fp-extract-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const button = document.createElement('button');
    button.id = 'fp-extract-btn';
    button.textContent = '📊 Extract Data';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.background = '#0056b3';
        button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.background = '#007bff';
        button.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('click', async () => {
        button.textContent = '⏳ Extracting...';
        button.style.background = '#ffc107';
        button.style.color = '#000';
        
        try {
            const data = extractPlayersData();
            
            if (data.length === 0) {
                button.textContent = '❌ No Data Found';
                button.style.background = '#dc3545';
                button.style.color = '#fff';
                setTimeout(() => {
                    button.textContent = '📊 Extract Data';
                    button.style.background = '#007bff';
                    button.style.color = '#fff';
                }, 3000);
                return;
            }
            
            // Create and download file
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fantasypros-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Copy to clipboard (Firefox method)
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(jsonString);
                } else {
                    // Fallback for older Firefox versions
                    const textArea = document.createElement('textarea');
                    textArea.value = jsonString;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
            } catch (clipboardError) {
                console.log('Clipboard not available, data only downloaded');
            }
            
            // Success feedback
            button.textContent = '✅ Downloaded!';
            button.style.background = '#28a745';
            button.style.color = '#fff';
            
            console.log(`Successfully extracted ${data.length} players. Data downloaded.`);
            
            setTimeout(() => {
                button.textContent = '📊 Extract Data';
                button.style.background = '#007bff';
                button.style.color = '#fff';
            }, 3000);
            
        } catch (error) {
            console.error('Extraction failed:', error);
            button.textContent = '❌ Error';
            button.style.background = '#dc3545';
            button.style.color = '#fff';
            
            setTimeout(() => {
                button.textContent = '📊 Extract Data';
                button.style.background = '#007bff';
                button.style.color = '#fff';
            }, 3000);
        }
    });
    
    document.body.appendChild(button);
    console.log('FantasyPros Data Extractor button injected');
}

// Inject button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtractionButton);
} else {
    injectExtractionButton();
}

// Re-inject if page content changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const hasTable = Array.from(mutation.addedNodes).some(node => 
                node.nodeType === Node.ELEMENT_NODE && 
                (node.querySelector?.('.player-row') || node.classList?.contains('player-row'))
            );
            if (hasTable) {
                setTimeout(injectExtractionButton, 1000);
            }
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

