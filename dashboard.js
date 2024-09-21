document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: "getFlaggedWords"}, function(response) {
        const wordTableBody = document.getElementById('wordTableBody');
        const flaggedWords = response || {};

        if (Object.keys(flaggedWords).length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.textContent = 'No flagged words found yet.';
            row.appendChild(cell);
            wordTableBody.appendChild(row);
        } else {
            for (const [word, count] of Object.entries(flaggedWords)) {
                const row = document.createElement('tr');
                const wordCell = document.createElement('td');
                const countCell = document.createElement('td');

                wordCell.textContent = word;
                countCell.textContent = count;

                row.appendChild(wordCell);
                row.appendChild(countCell);
                wordTableBody.appendChild(row);
            }
        }
    });
});