import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    Dialog,
    IconButton,
    TextField,
    Box,
    Typography,
    ClickAwayListener,
    Popover,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close, Send, ChevronLeft, ChevronRight, Photo, Description, PlayCircle } from '@mui/icons-material';
import { InsertEmoticon } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Styled Components - Estilo WhatsApp Web
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        backgroundColor: '#0b141a',
        maxWidth: '90vw',
        width: '90vw',
        height: '90vh',
        margin: 0,
        borderRadius: '8px',
        overflow: 'hidden',
    },
}));

const HeaderContainer = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#202c33',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const HeaderLeft = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}));

const HeaderTitle = styled(Typography)(() => ({
    color: '#e9edef',
    fontSize: '16px',
    fontWeight: 500,
}));

const HeaderSubtitle = styled(Typography)(() => ({
    color: '#8696a0',
    fontSize: '13px',
}));

const ContentContainer = styled(Box)(() => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b141a',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
}));

const MediaWrapper = styled(Box)(() => ({
    maxWidth: '80%',
    maxHeight: '80%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledImage = styled('img')(() => ({
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '8px',
}));

const StyledVideo = styled('video')(() => ({
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '8px',
}));

const NavigationButton = styled(IconButton)(({ direction }) => ({
    position: 'absolute',
    top: '50%',
    [direction]: '20px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#e9edef',
    width: '48px',
    height: '48px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    '&:disabled': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(233, 237, 239, 0.3)',
    },
}));

const FooterContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#202c33',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

const MediaCounter = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const MediaThumbnail = styled(Box)(({ active }) => ({
    width: '48px',
    height: '48px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: active ? '2px solid #00a884' : '2px solid transparent',
    cursor: 'pointer',
    opacity: active ? 1 : 0.6,
    transition: 'all 0.2s ease',
    position: 'relative',
    '&:hover': {
        opacity: 1,
        transform: 'scale(1.05)',
    },
}));

const ThumbnailImage = styled('img')(() => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
}));

const InputContainer = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    position: 'relative',
}));

const EmojiButton = styled(IconButton)(() => ({
    color: '#8696a0',
    padding: '8px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#e9edef',
    },
}));

const EmojiPickerContainer = styled(Box)(() => ({
    position: 'absolute',
    bottom: '70px',
    left: '20px',
    zIndex: 9999,
    '& .emoji-mart': {
        backgroundColor: '#202c33',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
    },
    '& .emoji-mart-category-label span': {
        backgroundColor: '#202c33',
        color: '#e9edef',
    },
    '& .emoji-mart-search input': {
        backgroundColor: '#2a3942',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#e9edef',
        '&::placeholder': {
            color: '#8696a0',
        },
    },
    '& .emoji-mart-bar': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '& .emoji-mart-anchors': {
        backgroundColor: '#202c33',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '& .emoji-mart-anchor': {
        color: '#8696a0',
        '&:hover': {
            color: '#e9edef',
        },
    },
    '& .emoji-mart-anchor-selected': {
        color: '#00a884',
    },
}));

const StyledTextField = styled(TextField)(() => ({
    flex: 1,
    '& .MuiInputBase-root': {
        backgroundColor: '#2a3942',
        borderRadius: '8px',
        color: '#e9edef',
        fontSize: '15px',
        padding: '8px 12px',
        '&:before, &:after': {
            display: 'none',
        },
    },
    '& .MuiInputBase-input': {
        padding: 0,
        '&::placeholder': {
            color: '#8696a0',
            opacity: 1,
        },
    },
}));

const SendButton = styled(IconButton)(() => ({
    backgroundColor: '#00a884',
    color: 'white',
    width: '48px',
    height: '48px',
    '&:hover': {
        backgroundColor: '#06cf9c',
    },
    '&:disabled': {
        backgroundColor: 'rgba(0, 168, 132, 0.3)',
    },
}));

const FileTypeIcon = styled(Box)(() => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2c34',
}));

const DocumentPreview = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '40px',
    backgroundColor: '#1f2c34',
    borderRadius: '8px',
    minWidth: '300px',
}));

const DocumentIcon = styled(Description)(() => ({
    fontSize: '64px',
    color: '#00a884',
}));

const DocumentName = styled(Typography)(() => ({
    color: '#e9edef',
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'center',
    wordBreak: 'break-word',
}));

const MediaPreviewModal = ({ isOpen, files, onClose, onSend, onCancelSelection }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [captions, setCaptions] = useState(files.map(() => ''));
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textFieldRef = useRef(null);

    const currentFile = files[currentIndex];

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleCaptionChange = (e) => {
        const value = e.target.value;
        setCaptions((prevCaptions) => {
            const updatedCaptions = [...prevCaptions];
            updatedCaptions[currentIndex] = value;
            return updatedCaptions;
        });
    };

    const handleEmojiSelect = (emoji) => {
        const currentCaption = captions[currentIndex] || '';
        setCaptions((prevCaptions) => {
            const updatedCaptions = [...prevCaptions];
            updatedCaptions[currentIndex] = currentCaption + emoji.native;
            return updatedCaptions;
        });
        setShowEmojiPicker(false);
        // Focar no input após adicionar emoji
        if (textFieldRef.current) {
            textFieldRef.current.focus();
        }
    };

    const handleSend = () => {
        const selectedMedias = files.map((file, index) => ({
            file,
            caption: captions[index],
        }));
        onSend(selectedMedias);
        onClose();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            onCancelSelection();
        } else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        } else if (event.key === 'ArrowRight') {
            handleNext();
        } else if (event.key === 'ArrowLeft') {
            handlePrev();
        }
    };

    const renderMediaContent = useMemo(() => {
        if (!currentFile) return null;

        if (currentFile.type.startsWith('image')) {
            return (
                <MediaWrapper>
                    <StyledImage
                        src={URL.createObjectURL(currentFile)}
                        alt={currentFile.name}
                    />
                </MediaWrapper>
            );
        } else if (currentFile.type.startsWith('video')) {
            return (
                <MediaWrapper>
                    <StyledVideo
                        src={URL.createObjectURL(currentFile)}
                        controls
                        volume={localStorage.getItem("volume") || 1}
                    />
                </MediaWrapper>
            );
        } else if (currentFile.type === 'application/pdf') {
            return (
                <DocumentPreview>
                    <Document
                        file={URL.createObjectURL(currentFile)}
                    >
                        <Page
                            pageNumber={1}
                            width={300}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />
                    </Document>
                    <DocumentName>{currentFile.name}</DocumentName>
                </DocumentPreview>
            );
        } else {
            return (
                <DocumentPreview>
                    <DocumentIcon />
                    <DocumentName>{currentFile.name}</DocumentName>
                    <Typography sx={{ color: '#8696a0', fontSize: '14px' }}>
                        {(currentFile.size / 1024).toFixed(2)} KB
                    </Typography>
                </DocumentPreview>
            );
        }
    }, [currentFile]);

    const renderThumbnail = (file, index) => {
        if (file.type.startsWith('image')) {
            return (
                <ThumbnailImage
                    src={URL.createObjectURL(file)}
                    alt={`Thumb ${index + 1}`}
                />
            );
        } else if (file.type.startsWith('video')) {
            return (
                <FileTypeIcon>
                    <PlayCircle sx={{ color: '#00a884', fontSize: '24px' }} />
                </FileTypeIcon>
            );
        } else {
            return (
                <FileTypeIcon>
                    <Description sx={{ color: '#00a884', fontSize: '24px' }} />
                </FileTypeIcon>
            );
        }
    };

    return (
        <StyledDialog
            open={isOpen}
            onClose={onCancelSelection}
            maxWidth={false}
            fullWidth
        >
            {/* Header */}
            <HeaderContainer>
                <HeaderLeft>
                    <IconButton
                        onClick={onCancelSelection}
                        sx={{
                            color: '#8696a0',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                    <Box>
                        <HeaderTitle>Pré-visualização</HeaderTitle>
                        <HeaderSubtitle>
                            {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
                        </HeaderSubtitle>
                    </Box>
                </HeaderLeft>
            </HeaderContainer>

            {/* Media Content */}
            <ContentContainer>
                {renderMediaContent}

                {/* Navigation Buttons */}
                {files.length > 1 && (
                    <>
                        <NavigationButton
                            direction="left"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft />
                        </NavigationButton>
                        <NavigationButton
                            direction="right"
                            onClick={handleNext}
                            disabled={currentIndex === files.length - 1}
                        >
                            <ChevronRight />
                        </NavigationButton>
                    </>
                )}
            </ContentContainer>

            {/* Footer */}
            <FooterContainer>
                {/* Media Counter/Thumbnails */}
                {files.length > 1 && (
                    <MediaCounter>
                        {files.map((file, index) => (
                            <MediaThumbnail
                                key={index}
                                active={index === currentIndex}
                                onClick={() => setCurrentIndex(index)}
                            >
                                {renderThumbnail(file, index)}
                            </MediaThumbnail>
                        ))}
                    </MediaCounter>
                )}

                {/* Caption Input */}
                <InputContainer>
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
                            <EmojiPickerContainer>
                                <Picker
                                    onSelect={handleEmojiSelect}
                                    theme="dark"
                                    set="google"
                                    showPreview={false}
                                    showSkinTones={false}
                                    perLine={9}
                                    title="Escolha um emoji"
                                    emoji="point_up"
                                />
                            </EmojiPickerContainer>
                        </ClickAwayListener>
                    )}

                    {/* Botão de Emoji */}
                    <EmojiButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <InsertEmoticon />
                    </EmojiButton>

                    {/* Campo de Legenda */}
                    <StyledTextField
                        inputRef={textFieldRef}
                        placeholder="Adicione uma legenda..."
                        multiline
                        maxRows={4}
                        value={captions[currentIndex]}
                        onChange={handleCaptionChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        variant="standard"
                    />

                    {/* Botão de Enviar */}
                    <SendButton onClick={handleSend}>
                        <Send />
                    </SendButton>
                </InputContainer>
            </FooterContainer>
        </StyledDialog>
    );
};

export default MediaPreviewModal;
