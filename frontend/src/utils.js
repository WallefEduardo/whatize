function forceDownload(blob, filename) {
    var a = document.createElement('a');
    a.download = filename;
    a.href = blob;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Função auxiliar para decodificar caracteres especiais em URLs
function decodeFileName(fileName) {
    if (!fileName) return fileName;
    
    try {
        // Decodifica caracteres especiais que podem estar encoded na URL
        return decodeURIComponent(fileName);
    } catch (error) {
        // Se falhar na decodificação, retorna o nome original
        console.warn('Erro ao decodificar nome do arquivo:', error);
        return fileName;
    }
}

// Função para sanitizar nome de arquivo removendo caracteres problemáticos
function sanitizeFileName(fileName) {
    if (!fileName) return fileName;
    
    // Remove ou substitui caracteres que podem causar problemas no sistema de arquivos
    return fileName
        // Remove caracteres especiais problemáticos
        .replace(/[<>:"/\\|?*%@#()[\]{}+]/g, '')
        // Substitui múltiplos espaços por um único espaço
        .replace(/\s+/g, ' ')
        // Remove espaços no início e fim
        .trim()
        // Limita o tamanho do nome (máximo 200 caracteres para compatibilidade)
        .substring(0, 200);
}

// Função para extrair o nome original do arquivo removendo os timestamps
function getOriginalFileName(fileName) {
    if (!fileName) return fileName;
    
    // Primeiro decodifica caracteres especiais
    const decodedFileName = decodeFileName(fileName);
    
    // Extrai apenas o nome do arquivo da URL se necessário
    const baseName = decodedFileName.split('\\').pop().split('/').pop();
    
    // Remove extensão temporariamente
    const lastDotIndex = baseName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? baseName.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? baseName.substring(0, lastDotIndex) : baseName;
    
    // Padrão para remover números de timestamp no início e fim do nome
    // Exemplo: 1750034602009_Kit_de_Ferramentas_Hackers_1750034602009 -> Kit_de_Ferramentas_Hackers
    const cleanName = nameWithoutExt.replace(/^\d+_/, '').replace(/_\d+$/, '');
    
    // Substitui underscores por espaços para melhor legibilidade
    const readableName = cleanName.replace(/_/g, ' ');
    
    // Sanitiza o nome final para evitar problemas no sistema de arquivos
    const sanitizedName = sanitizeFileName(readableName);
    
    // Garante que o nome não fique vazio
    const finalName = sanitizedName || 'arquivo';
    
    return finalName + extension;
}

function downloadResource(url, filename) {
    if (!filename) {
        const urlFileName = url.split('\\').pop().split('/').pop();
        filename = getOriginalFileName(urlFileName);
    }
    
    // Sanitiza o nome do arquivo final para garantir compatibilidade
    const sanitizedFilename = sanitizeFileName(filename);
    
    // Codifica a URL corretamente para lidar com caracteres especiais
    // Usa encodeURI em vez de encodeURIComponent para preservar a estrutura da URL
    let encodedUrl;
    try {
        // Primeiro tenta criar um objeto URL para validar
        const urlObj = new URL(url, window.location.origin);
        encodedUrl = urlObj.href;
    } catch (error) {
        // Se falhar, usa encodeURI como fallback
        encodedUrl = encodeURI(url);
    }
    
    fetch(encodedUrl, {
        headers: new Headers({
            'Origin': window.location.origin
        }),
        mode: 'cors'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Verifica se o blob é válido
            if (!blob || blob.size === 0) {
                throw new Error('Arquivo vazio ou inválido');
            }
            
            let blobUrl = window.URL.createObjectURL(blob);
            forceDownload(blobUrl, sanitizedFilename);
            
            // Limpa o blob URL após o download para liberar memória
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000); // Aumentado para 1 segundo para garantir que o download complete
        })
        .catch(e => {
            console.error('Erro no download do arquivo:', e);
            // Tenta download direto como fallback
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = sanitizedFilename;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (fallbackError) {
                console.error('Erro no fallback de download:', fallbackError);
                // Último recurso: abre em nova aba
                window.open(url, '_blank');
            }
        });
}

// Função específica para sanitizar arquivos antes do upload
function sanitizeFileForUpload(file) {
    if (!file) return file;
    
    // Sanitiza o nome do arquivo
    const sanitizedName = sanitizeFileName(file.name);
    
    // Cria um novo arquivo com o nome sanitizado
    const sanitizedFile = new File([file], sanitizedName, {
        type: file.type,
        lastModified: file.lastModified
    });
    
    return sanitizedFile;
}

const insertNineDigitBrazilianPhoneNumber = (number) => {
    if (number.length === 12) {
        return number.slice(0, 4) + '9' + number.slice(4);
    }
    return number;
}


export { downloadResource, insertNineDigitBrazilianPhoneNumber, sanitizeFileForUpload, sanitizeFileName }