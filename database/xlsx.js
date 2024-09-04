const fs = require('fs');
const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();

async function run() {
    const wsName = 'Posts';
    const groupUrl = `https://www.facebook.com/${process.env.GROUP_ID}`;

    const wsData = [
        ['Group URL', 'Author', 'Author Link', 'Content', 'Image URLs', 'Comments']
    ];

    const jsonData = require('../facebook/results.json');
    jsonData.forEach((item, index) => {
        const imgUrls = item.imgUrls.join('\n\n');
        const comments = item.comments.map(comment => `${comment.author}: ${comment.content}`).join('\n\n');

        const authorLink = `=HYPERLINK("${item.authorLink}", "${item.author}")`;
        wsData.push([
            index === 0 ? { t: 's', v: groupUrl, l: { Target: groupUrl } } : '',
            { t: 's', v: item.author },
            { t: 's', v: item.authorLink, l: { Target: item.authorLink } },
            { t: 's', v: item.content },
            { t: 's', v: imgUrls },
            { t: 's', v: comments }
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const wsCols = [
        { wch: 60 },
        { wch: 20 },
        { wch: 40 }, 
        { wch: 60 }, 
        { wch: 60 },
        { wch: 60 }
    ];
    ws['!cols'] = wsCols;

    XLSX.utils.book_append_sheet(wb, ws, wsName);

    const excelFilePath = './output.xlsx';
    XLSX.writeFile(wb, excelFilePath);

    console.log(`Excel file "${excelFilePath}" generated successfully.`);

}

module.exports = { run };
