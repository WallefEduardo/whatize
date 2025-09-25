import React, { useState, memo } from 'react';
import { Box, Typography, IconButton, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Download,
  InsertDriveFile,
  PictureAsPdf,
  Description,
  TableChart,
  Archive,
  Code,
  Image as ImageIcon,
  VideoFile,
  AudioFile
} from '@mui/icons-material';
import { getBackendUrl } from '../../../config';
import api from '../../../services/api';

const DocumentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: isSent
    ? 'rgba(0, 195, 7, 0.15)'
    : 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  maxWidth: '320px',
  width: '100%',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignSelf: isSent ? 'flex-end' : 'flex-start',

  '&:hover': {
    backgroundColor: isSent
      ? 'rgba(0, 195, 7, 0.25)'
      : 'var(--bg-tertiary)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const FileIcon = styled(Box)(() => ({
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

const FileInfo = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  marginRight: '8px',
}));

const FileName = styled(Typography)(() => ({
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginBottom: '2px',
}));

const FileSize = styled(Typography)(() => ({
  fontSize: '12px',
  color: 'var(--text-secondary)',
}));

const DownloadButton = styled(IconButton)(() => ({
  backgroundColor: 'var(--color-accent)',
  color: 'white',
  width: '36px',
  height: '36px',
  '&:hover': {
    backgroundColor: 'var(--color-green-hover)',
  },
}));

const Caption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '8px 12px',
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'var(--text-primary)',
  backgroundColor: isSent
    ? 'rgba(0, 195, 7, 0.15)'
    : 'var(--bg-secondary)',
  borderRadius: '0 0 8px 8px',
  wordBreak: 'break-word',
}));

const ProgressContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '4px',
  gap: '8px',
}));

/**
 * Utilitário para detectar tipo de arquivo e retornar ícone apropriado
 */
const getFileIcon = (fileName, mediaType) => {
  const name = fileName?.toLowerCase() || '';
  const type = mediaType?.toLowerCase() || '';

  // PDFs
  if (name.includes('.pdf') || type.includes('pdf')) {
    return <PictureAsPdf />;
  }

  // Documentos de texto
  if (name.includes('.doc') || name.includes('.docx') ||
      name.includes('.txt') || type.includes('word') ||
      type.includes('text')) {
    return <Description />;
  }

  // Planilhas
  if (name.includes('.xls') || name.includes('.xlsx') ||
      name.includes('.csv') || type.includes('excel') ||
      type.includes('spreadsheet')) {
    return <TableChart />;
  }

  // Arquivos compactados
  if (name.includes('.zip') || name.includes('.rar') ||
      name.includes('.7z') || type.includes('zip') ||
      type.includes('archive')) {
    return <Archive />;
  }

  // Códigos
  if (name.includes('.js') || name.includes('.css') ||
      name.includes('.html') || name.includes('.json') ||
      name.includes('.xml') || name.includes('.php') ||
      type.includes('javascript') || type.includes('css')) {
    return <Code />;
  }

  // Imagens (como fallback)
  if (type.includes('image')) {
    return <ImageIcon />;
  }

  // Vídeos (como fallback)
  if (type.includes('video')) {
    return <VideoFile />;
  }

  // Áudios (como fallback)
  if (type.includes('audio')) {
    return <AudioFile />;
  }

  // Genérico
  return <InsertDriveFile />;
};

/**
 * Utilitário para formatar tamanho do arquivo
 */
const formatFileSize = (bytes) => {
  if (!bytes) return 'Tamanho desconhecido';

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${size} ${sizes[i]}`;
};

/**
 * Utilitário para extrair nome do arquivo da URL
 */
const getFileNameFromUrl = (url) => {
  if (!url) return 'documento';

  try {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    return fileName || 'documento';
  } catch {
    return url.split('/').pop() || 'documento';
  }
};

/**
 * DocumentMessage - Componente para renderizar mensagens de documento
 */
const DocumentMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const backendUrl = getBackendUrl();
  const { mediaUrl, body, fileName, fileSize, mediaType } = message;

  const documentUrl = mediaUrl?.startsWith('http')
    ? mediaUrl
    : `${backendUrl}${mediaUrl}`;

  const displayFileName = fileName || getFileNameFromUrl(mediaUrl) || 'documento';
  const displayFileSize = formatFileSize(fileSize);
  const fileIcon = getFileIcon(displayFileName, mediaType);

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

  return (
    <Box>
      <DocumentContainer
        isSent={isSent}
        onClick={handleOpen}
      >
        <FileIcon>
          {fileIcon}
        </FileIcon>

        <FileInfo>
          <FileName title={displayFileName}>
            {displayFileName}
          </FileName>
          <FileSize>
            {displayFileSize}
          </FileSize>

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
        </FileInfo>

        <DownloadButton
          onClick={handleDownload}
          disabled={isDownloading}
          title="Baixar arquivo"
          size="small"
        >
          <Download sx={{ fontSize: '18px' }} />
        </DownloadButton>
      </DocumentContainer>

      {body && (
        <Caption isSent={isSent}>
          {body}
        </Caption>
      )}
    </Box>
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