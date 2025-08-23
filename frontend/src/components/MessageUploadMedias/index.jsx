import React, { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    TextField,
    Card,
    CardContent,
    Box,
} from '@mui/material';
import { Cancel, Search, Send, SkipNext, SkipPrevious, Close } from '@mui/icons-material';
import AudioModal from '../AudioModal';
import { Document, Page, pdfjs } from 'react-pdf';
import { grey } from '@mui/material/colors';
import { InputAdornment, InputBase } from '@mui/material';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const MessageUploadMedias = ({ isOpen, files, onClose, onSend, onCancelSelection }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [captions, setCaptions] = useState(files.map(() => ''));
    const [numPages, setNumPages] = React.useState(null);
    const [componentMounted, setComponentMounted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [firstTyping, setFirstTyping] = useState(false);

    useEffect(() => {
        setFirstTyping(true);
        setComponentMounted(true);
    }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleClose = () => {
        onClose();
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setFirstTyping(true);
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setFirstTyping(true);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleTextFieldBlur = () => {
        setIsTyping(false);
    };

    const handleCaptionChange = (e) => {
        const value = e.target.value;
        setCaptions((prevCaptions) => {
            const updatedCaptions = [...prevCaptions];
            updatedCaptions[currentIndex] = value;
            return updatedCaptions;
        });
        if (firstTyping) {
            setIsTyping(true);
        }
    };

    const handleSend = () => {
        const selectedMedias = files.map((file, index) => ({
            file,
            caption: captions[index],
        }));
        onSend(selectedMedias);
        handleClose();
    };

    const renderFileContent = useMemo(() => {
        if (!componentMounted) {
            return null;
        }
        if (firstTyping) {
            const currentFile = files[currentIndex];
            if (currentFile.type.startsWith('image')) {
                return (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: "400px",
                                background: "var(--color-primary)"
                            }}
                        >
                            <img
                                alt={`Imagem ${currentIndex + 1}`}
                                src={URL.createObjectURL(currentFile)}
                                style={{
                                    maxWidth: "600px",
                                    maxHeight: "400px",
                                }}
                            />
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: "var(--color-primary)"
                            }}
                        >
                            <Typography variant="h6">{currentFile.name}</Typography>
                        </Box>
                    </>

                );
            } else if (currentFile.type === 'application/pdf') {
                return (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '400px',
                                background: "var(--color-primary)"
                            }}
                        >
                            <Document file={URL.createObjectURL(currentFile)} onLoadSuccess={onDocumentLoadSuccess} >
                                <Page pageNumber={1}
                                    width={200}
                                    height={300}
                                />
                            </Document>
                        </Box>
                        <Box 
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: "var(--color-primary)"
                            }}
                        >
                            <Typography variant="h6">{currentFile.name}</Typography>
                        </Box>
                    </>
                );
            } else if (currentFile.type.startsWith('video')) {
                return (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '400px',
                                background: "var(--color-primary)"
                            }}
                        >
                            <video
                                src={URL.createObjectURL(currentFile)}
                                controls={true}
                                volume={localStorage.getItem("volume")}
                                style={{
                                    maxWidth: "600px",
                                    maxHeight: "400px",
                                }}
                            />
                        </Box>
                        <Box 
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: "var(--color-primary)"
                            }}
                        >
                            <Typography variant="h6">{currentFile.name}</Typography>
                        </Box>
                    </>
                );
            } else if (currentFile.type.startsWith('audio')) {
                return (
                    <><Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            background: "var(--color-primary)"
                        }}
                    >
                        <AudioModal url={URL.createObjectURL(currentFile)} />
                    </Box>
                        <Box 
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: "var(--color-primary)"
                            }}
                        >
                            <Typography variant="h6">{currentFile.name}</Typography>
                        </Box>
                    </>
                );
            } else {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            background: "var(--color-primary)"
                        }}
                    >
                        <CardContent 
                            sx={{ background: "var(--color-primary)" }}
                        >
                            <Typography variant="h6">Visualização não disponível</Typography>
                            <Typography variant="h6">{currentFile.name}</Typography>
                        </CardContent>
                    </Box>
                );
            }
        }
        return null;
    }, [currentIndex, firstTyping]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.shiftKey) {
            // const newCaptions = captions.slice();
            // newCaptions[currentIndex] += '\n';
            // setCaptions(newCaptions);
            return
        }
        switch (event.key) {
            case 'Escape':
                onCancelSelection();
                break;
            case 'Enter':
                handleSend();
                break;
            case 'ArrowRight':
                handleNext();
                break;
            case 'ArrowLeft':
                handlePrev();
                break;
            default:
                break;
        }
    };
    return (
        <Box sx={{ background: "var(--color-primary)" }}>
            <Dialog
                open={isOpen}
                fullWidth
                maxWidth="md"
                scroll="paper"
            >
                {/* Ícone X no canto superior direito */}
                <IconButton 
                    onClick={onCancelSelection}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1000,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    }}
                >
                    <Close />
                </IconButton>
                
                <DialogContent sx={{ background: "var(--color-primary)" }}>
                    <Card>
                        {renderFileContent}
                        <CardContent sx={{ background: "var(--color-primary)" }}>
                            <Box sx={{ 
                                padding: '6px',
                                marginRight: '7px',
                                background: "var(--color-primary)",
                                display: "flex",
                                borderRadius: '20px',
                                flex: 1,
                                position: "relative",
                            }}>
                                <InputBase
                                    placeholder="Legenda (opcional)"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                    maxRows={5}
                                    value={captions[currentIndex]}
                                    onChange={handleCaptionChange}
                                    onBlur={handleTextFieldBlur}
                                    autoFocus
                                    onKeyDown={handleKeyDown}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </DialogContent>
                <DialogActions sx={{ background: "var(--color-primary)" }}>
                    <IconButton onClick={handlePrev} disabled={currentIndex === 0}>
                        <SkipPrevious sx={{ color: currentIndex === 0 ? grey[400] : "grey" }} />
                    </IconButton>
                    <IconButton onClick={handleSend} >
                        <Send sx={{ color: "grey" }} />
                    </IconButton>
                    <IconButton onClick={handleNext} disabled={currentIndex === files.length - 1}>
                        <SkipNext sx={{ color: currentIndex === files.length - 1 ? grey[400] : "grey" }} />
                    </IconButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageUploadMedias;
