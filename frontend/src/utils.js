function forceDownload(blob, filename) {
    var a = document.createElement('a');
    a.download = filename;
    a.href = blob;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Função para extrair o nome original do arquivo removendo os timestamps
function getOriginalFileName(fileName) {
    if (!fileName) return fileName;
    
    // Extrai apenas o nome do arquivo da URL se necessário
    const baseName = fileName.split('\\').pop().split('/').pop();
    
    // Remove extensão temporariamente
    const lastDotIndex = baseName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? baseName.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? baseName.substring(0, lastDotIndex) : baseName;
    
    // Padrão para remover números de timestamp no início e fim do nome
    // Exemplo: 1750034602009_Kit_de_Ferramentas_Hackers_1750034602009 -> Kit_de_Ferramentas_Hackers
    const cleanName = nameWithoutExt.replace(/^\d+_/, '').replace(/_\d+$/, '');
    
    // Substitui underscores por espaços para melhor legibilidade
    const readableName = cleanName.replace(/_/g, ' ');
    
    return readableName + extension;
}

function downloadResource(url, filename) {
    if (!filename) {
        const urlFileName = url.split('\\').pop().split('/').pop();
        filename = getOriginalFileName(urlFileName);
    }
    fetch(url, {
        headers: new Headers({
            'Origin': window.location.origin
        }),
        mode: 'cors'
    })
        .then(response => response.blob())
        .then(blob => {
            let blobUrl = window.URL.createObjectURL(blob);
            forceDownload(blobUrl, filename);
        })
        .catch(e => console.error(e));
}

const insertNineDigitBrazilianPhoneNumber = (number) => {
    if (number.length === 12) {
        return number.slice(0, 4) + '9' + number.slice(4);
    }
    return number;
}


export { downloadResource, insertNineDigitBrazilianPhoneNumber }