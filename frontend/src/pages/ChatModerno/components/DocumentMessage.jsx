import React, { useState, memo } from 'react';
import { Box, Typography, IconButton, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Download, InsertDriveFile, PictureAsPdf } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { getBackendUrl } from '../../../config';
import { sanitizeMediaUrl } from './mediaUtils';
import api from '../../../services/api';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ============= STYLED COMPONENTS =============

const DocumentWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '320px',
  width: '100%',
}));

// Container do PDF com preview visual
const PdfPreviewContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#fff',
  border: '1px solid var(--border-primary)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignSelf: isSent ? 'flex-end' : 'flex-start',

  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
}));

// Container do preview da primeira página
const PdfPagePreview = styled(Box)(() => ({
  position: 'relative',
  width: '100%',
  height: '180px',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  overflow: 'hidden',

  '& .react-pdf__Page': {
    display: 'block',
    width: '100%',
    margin: 0,
    padding: 0,
  },

  '& .react-pdf__Page__canvas': {
    width: '100% !important',
    height: 'auto !important',
    display: 'block',
    margin: 0,
  },
}));

// Overlay gradient sobre o preview
const PdfOverlay = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '60px',
  background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
  pointerEvents: 'none',
}));

// Botão de download no preview (estilo WhatsApp)
const PreviewDownloadButton = styled(IconButton)(() => ({
  position: 'absolute',
  bottom: '12px',
  right: '12px',
  backgroundColor: 'rgba(0, 168, 132, 0.9)',
  color: 'white',
  width: '40px',
  height: '40px',
  zIndex: 2,

  '&:hover': {
    backgroundColor: '#00a884',
  },
}));

// Container de info do arquivo
const PdfInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  backgroundColor: '#fff',
  gap: '12px',
}));

const FileIconWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  backgroundColor: '#d32f2f',
  color: 'white',
  flexShrink: 0,
}));

const FileDetails = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

const FileName = styled(Typography)(() => ({
  fontSize: '13px',
  fontWeight: 600,
  color: '#000',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  marginBottom: '2px',
  lineHeight: 1.3,
}));

const FileMetadata = styled(Typography)(() => ({
  fontSize: '12px',
  color: '#667781',
  wordBreak: 'break-word',
}));

const DownloadButton = styled(IconButton)(() => ({
  backgroundColor: '#8696a0',
  color: 'white',
  width: '36px',
  height: '36px',
  flexShrink: 0,

  '&:hover': {
    backgroundColor: '#667781',
  },

  '&:disabled': {
    backgroundColor: '#e0e0e0',
  },
}));

// Container genérico (para não-PDFs)
const GenericDocContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: isSent ? 'rgba(0, 195, 7, 0.15)' : 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  maxWidth: '320px',
  width: '100%',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignSelf: isSent ? 'flex-end' : 'flex-start',

  '&:hover': {
    backgroundColor: isSent ? 'rgba(0, 195, 7, 0.25)' : 'var(--bg-tertiary)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const GenericFileIcon = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: 'var(--color-accent)',
  color: 'white',
  marginRight: '12px',
  flexShrink: 0,
}));

const Caption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '8px 12px',
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'var(--text-primary)',
  backgroundColor: isSent ? 'rgba(0, 195, 7, 0.15)' : 'var(--bg-secondary)',
  borderRadius: '0 0 8px 8px',
  wordBreak: 'break-word',
  marginTop: '4px',
}));

const ProgressContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '4px',
  gap: '8px',
}));

const LoadingPlaceholder = styled(Box)(() => ({
  width: '100%',
  height: '180px',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  color: '#667781',
}));

// ============= UTILITIES =============

const formatFileSize = (bytes) => {
  if (!bytes) return 'Tamanho desconhecido';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${size} ${sizes[i]}`;
};

const getFileNameFromUrl = (url) => {
  if (!url) return 'documento';
  try {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    return decodeURIComponent(fileName || 'documento');
  } catch {
    return url.split('/').pop() || 'documento';
  }
};

// Limpar nome do arquivo removendo timestamp/ID no início e fim
const cleanFileName = (fileName) => {
  if (!fileName) return 'documento';

  // Remove padrões como:
  // "405988_-_CLICK-2_1760078182224.pdf" -> "CLICK-2.pdf"
  // "1760078182243_Orcamento_1225.pdf" -> "Orcamento_1225.pdf"

  let cleaned = fileName;

  // Remove números no início seguidos de _ ou _-_
  cleaned = cleaned.replace(/^\d+_+(-_)?/g, '');

  // Remove _números antes da extensão
  cleaned = cleaned.replace(/_\d+(\.[^.]+)$/, '$1');

  // Substitui múltiplos underscores por espaço
  cleaned = cleaned.replace(/_+/g, ' ');

  // Remove espaços extras
  cleaned = cleaned.trim();

  return cleaned || fileName;
};

const isPdfFile = (fileName, mediaType) => {
  const name = fileName?.toLowerCase() || '';
  const type = mediaType?.toLowerCase() || '';
  return name.includes('.pdf') || type.includes('pdf');
};

// ============= MAIN COMPONENT =============

const DocumentMessage = ({ message, isSent = false, onLoad, onError }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [realFileSize, setRealFileSize] = useState(null);

  const backendUrl = getBackendUrl();
  const { mediaUrl, body, fileName, fileSize, mediaType } = message;

  // ✅ Se já é blob URL (mensagem otimista), usar diretamente
  const isOptimisticBlob = mediaUrl?.startsWith('blob:');

  // Construir URL e sanitizar para remover portas duplicadas
  const rawUrl = isOptimisticBlob
    ? mediaUrl
    : (mediaUrl?.startsWith('http') ? mediaUrl : `${backendUrl}${mediaUrl}`);
  const documentUrl = isOptimisticBlob ? mediaUrl : sanitizeMediaUrl(rawUrl);

  const rawFileName = fileName || getFileNameFromUrl(mediaUrl) || 'documento';
  const displayFileName = cleanFileName(rawFileName);
  const displayFileSize = formatFileSize(realFileSize || fileSize);
  const isPdf = isPdfFile(rawFileName, mediaType);

  // ✅ Extrair legenda: se body é diferente do nome do arquivo, é uma legenda
  const hasCaption = body && body !== rawFileName && body !== displayFileName;
  const caption = hasCaption ? body : null;

  // ✅ URL para exibição imediata do PDF (igual ao ImageMessage)
  const displayPdfUrl = pdfBlobUrl || (isOptimisticBlob && isPdf ? documentUrl : null);

  // Fetch arquivo e capturar tamanho real
  React.useEffect(() => {
    if (!documentUrl) return;

    // ✅ Se já é blob (mensagem otimista), usar diretamente
    if (isOptimisticBlob) {
      if (isPdf) {
        setPdfBlobUrl(documentUrl);
      }
      // Usar fileSize da mensagem otimista
      if (fileSize) {
        setRealFileSize(fileSize);
      }
      onLoad?.();
      return;
    }

    // ✅ URL do backend - fazer fetch via API
    const fetchFileBlob = async () => {
      try {
        const response = await api.get(documentUrl, { responseType: 'blob' });

        // Capturar tamanho real do blob
        setRealFileSize(response.data.size);

        // Se for PDF, criar blob URL para preview
        if (isPdf) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
        }

        onLoad?.();
      } catch (error) {
        console.error('Erro ao buscar arquivo:', error);
        if (isPdf) {
          setPdfError(true);
        }
        onError?.(error);
      }
    };

    fetchFileBlob();

    // Cleanup: só revogar se NÃO for blob otimista
    return () => {
      if (pdfBlobUrl && !isOptimisticBlob) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [documentUrl, isPdf, isOptimisticBlob, fileSize, onLoad, onError]);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(documentUrl);

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);

      let loaded = 0;
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total) {
          setDownloadProgress((loaded / total) * 100);
        }
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = displayFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onLoad?.();
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      onError?.(error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleOpen = () => {
    if (!isDownloading) {
      window.open(documentUrl, '_blank');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(false);
    onLoad?.();
  };

  const onDocumentLoadError = (error) => {
    console.error('Erro ao carregar PDF:', error);
    setPdfError(true);
    onError?.(error);
  };

  // Renderizar PDF com preview visual
  if (isPdf) {
    return (
      <DocumentWrapper>
        <PdfPreviewContainer isSent={isSent} onClick={handleOpen}>
          {/* Preview da primeira página */}
          <PdfPagePreview>
            {pdfError ? (
              <LoadingPlaceholder>
                <PictureAsPdf sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.5 }} />
              </LoadingPlaceholder>
            ) : !displayPdfUrl ? (
              <LoadingPlaceholder>
                Carregando PDF...
              </LoadingPlaceholder>
            ) : (
              <Document
                file={displayPdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={{
                  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                  cMapPacked: true,
                  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                }}
                loading={
                  <LoadingPlaceholder>
                    Renderizando...
                  </LoadingPlaceholder>
                }
                error={
                  <LoadingPlaceholder>
                    <PictureAsPdf sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.5 }} />
                  </LoadingPlaceholder>
                }
              >
                <Page
                  pageNumber={1}
                  width={320}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  renderMode="canvas"
                />
              </Document>
            )}
            <PdfOverlay />
          </PdfPagePreview>

          {/* Info do arquivo */}
          <PdfInfo>
            <FileIconWrapper>
              <PictureAsPdf sx={{ fontSize: 24 }} />
            </FileIconWrapper>

            <FileDetails>
              <FileName title={displayFileName}>
                {displayFileName}
              </FileName>
              <FileMetadata>
                {numPages ? `${numPages} página${numPages > 1 ? 's' : ''}` : ''} • PDF • {displayFileSize}
              </FileMetadata>

              {isDownloading && (
                <ProgressContainer>
                  <LinearProgress
                    variant="determinate"
                    value={downloadProgress}
                    sx={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00a884',
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '11px', color: '#667781' }}>
                    {Math.round(downloadProgress)}%
                  </Typography>
                </ProgressContainer>
              )}
            </FileDetails>

            <DownloadButton
              onClick={handleDownload}
              disabled={isDownloading}
              title="Baixar PDF"
              size="small"
            >
              <Download sx={{ fontSize: '18px' }} />
            </DownloadButton>
          </PdfInfo>
        </PdfPreviewContainer>

        {/* Legenda (se existir) */}
        {caption && (
          <Caption isSent={isSent}>
            {caption}
          </Caption>
        )}
      </DocumentWrapper>
    );
  }

  // Renderizar outros arquivos (modo genérico)
  return (
    <DocumentWrapper>
      <GenericDocContainer isSent={isSent} onClick={handleOpen}>
        <GenericFileIcon>
          <InsertDriveFile />
        </GenericFileIcon>

        <FileDetails>
          <FileName title={displayFileName}>
            {displayFileName}
          </FileName>
          <FileMetadata>{displayFileSize}</FileMetadata>

          {isDownloading && (
            <ProgressContainer>
              <LinearProgress
                variant="determinate"
                value={downloadProgress}
                sx={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'var(--color-accent)',
                  },
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {Math.round(downloadProgress)}%
              </Typography>
            </ProgressContainer>
          )}
        </FileDetails>

        <DownloadButton
          onClick={handleDownload}
          disabled={isDownloading}
          title="Baixar arquivo"
          size="small"
        >
          <Download sx={{ fontSize: '18px' }} />
        </DownloadButton>
      </GenericDocContainer>

      {/* Legenda (se existir) */}
      {caption && (
        <Caption isSent={isSent}>
          {caption}
        </Caption>
      )}
    </DocumentWrapper>
  );
};

export default memo(DocumentMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.message.fileName === nextProps.message.fileName &&
    prevProps.message.fileSize === nextProps.message.fileSize &&
    prevProps.isSent === nextProps.isSent
  );
});
