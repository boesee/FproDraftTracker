document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');
    
    extractBtn.addEventListener('click', function() {
        extractBtn.disabled = true;
        extractBtn.textContent = '⏳ Extracting...';
        status.innerHTML = '';
        
        // Get active tab
        browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) {
            const currentTab = tabs[0];
            
            // Check if we're on FantasyPros
            if (!currentTab.url.includes('fantasypros.com')) {
                status.innerHTML = `<div class="error">❌ Please navigate to a FantasyPros rankings page first.</div>`;
                extractBtn.disabled = false;
                extractBtn.textContent = '📊 Extract Player Data';
                return;
            }
            
            // Send message to content script
            browser.tabs.sendMessage(currentTab.id, {action: "extractData"})
                .then(function(response) {
                    extractBtn.disabled = false;
                    extractBtn.textContent = '📊 Extract Player Data';
                    
                    if (response && response.success) {
                        const data = response.data;
                        if (data.length > 0) {
                            status.innerHTML = `<div class="success">✅ Extracted ${data.length} players!<br>Data downloaded as JSON file.</div>`;
                            
                            // Download the data
                            const jsonString = JSON.stringify(data, null, 2);
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            
                            browser.downloads.download({
                                url: url,
                                filename: `fantasypros-data-${new Date().toISOString().split('T')[0]}.json`
                            }).then(() => {
                                URL.revokeObjectURL(url);
                            });
                            
                        } else {
                            status.innerHTML = `<div class="error">❌ No player data found. Make sure you're on a rankings page with a loaded table.</div>`;
                        }
                    } else {
                        status.innerHTML = `<div class="error">❌ Failed to extract data. Please try again.</div>`;
                    }
                })
                .catch(function(error) {
                    extractBtn.disabled = false;
                    extractBtn.textContent = '📊 Extract Player Data';
                    status.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
                });
        });
    });
});