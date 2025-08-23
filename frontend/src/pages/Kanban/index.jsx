import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Typography, Paper, Box, IconButton, Avatar, Chip, TextField, FormControl, InputLabel, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from "@mui/material";
import { WhatsApp, Person, LocalOffer, Send, MoreVert, Add, KeyboardArrowLeft, KeyboardArrowRight, Facebook, Instagram, AttachFile, EmojiEmotions, Mic, Event, Lock, VisibilityOff, Description, PermMedia, CameraAlt, Create, Comment, HighlightOff, CheckCircleOutline, GetApp, PictureAsPdf, Clear, AccessTime, Done, DoneAll } from "@mui/icons-material";
import { format, subMonths, isSameDay, parseISO } from "date-fns";
import { initializeMicRecorderPolyfill } from "../../utils/micRecorderPolyfill";

import MainContainer from "../../components/MainContainer";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import { toast } from "../../components/ui/ToastProvider";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Can } from "../../components/Can";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import { Menu, ClickAwayListener, CircularProgress } from "@mui/material";
// MicRecorder removido - usando mock do polyfill
import ContactSendModal from "../../components/ContactSendModal";
import CameraModal from "../../components/CameraModal";
import ScheduleModal from "../../components/ScheduleModal";
import MessageUploadMedias from "../../components/MessageUploadMedias";
import whatsappIcon from '../../assets/nopicture.png';
import { getBackendUrl } from "../../config";
import { sanitizeFileForUpload } from "../../utils";
// @dnd-kit imports
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Removidos componentes complexos que causavam problemas de contexto

// Inicializar polyfills antes de usar MicRecorder
initializeMicRecorderPolyfill();

// Instância do gravador de áudio (FORA do componente como no MessageInput)
// MicRecorder será inicializado usando window.global.MicRecorder do polyfill
let Mp3Recorder = null;

// URL do backend para as imagens
const backendUrl = getBackendUrl();

// Funções auxiliares
const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998", fontSize: "16px" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c", fontSize: "16px" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366", fontSize: "16px" }} />;
    default:
      return <WhatsApp style={{ color: "#25d366", fontSize: "16px" }} />;
  }
};

const getTextColor = (backgroundColor) => {
  if (!backgroundColor) return '#333';
  
  // Remove # se existir
  const hex = backgroundColor.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retorna cor do texto baseada na luminância
  return luminance > 0.5 ? '#333' : '#fff';
};

// Componente do Card Modernizado
const KanbanCard = ({ card, onSendMessage }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSendMessage = (e) => {
    e.stopPropagation();
    onSendMessage(card.ticketData);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      {/* Header do card com telefone e canal - Layout responsivo */}
<div className="card-header">
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    }}
  >
    {/* Esquerda: avatar, canal, telefone */}
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ marginRight: '2px' }}>
        <Avatar
          src={card.ticketData?.contact?.urlPicture || undefined}
          style={{ width: 30, height: 30 }}
        >
          {card.title.charAt(0)}
        </Avatar>
      </div>
      
      <Typography className="card-phone" style={{ marginLeft: 4 }}>
        {card.phone}
      </Typography>
    </div>
    {/* Direita: número do ticket */}
    <Typography className="card-ticket" style={{ marginLeft: 8 }}>
      {card.ticketId}
    </Typography>
  </div>
</div>

{/* Nome do contato */}
<Typography className="card-title">
  {card.title}
</Typography>

      {/* Data da última mensagem */}
      <Typography className="card-date" style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
        {card.ticketData ? (
          isSameDay(parseISO(card.ticketData.updatedAt), new Date())
            ? format(parseISO(card.ticketData.updatedAt), "HH:mm")
            : format(parseISO(card.ticketData.updatedAt), "dd/MM/yyyy")
        ) : 'Hoje'}
      </Typography>

      {/* Linha separadora ACIMA das tags */}
      {card.tags && card.tags.length > 0 && (
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#f1f3f4',
          margin: '8px 0 6px 0'
        }} />
      )}

      {/* Tags (organizadas inteligentemente para melhor aproveitamento do espaço) */}
{card.tags && card.tags.length > 0 && (
  <div className="card-tags">
    {(() => {
      // Algoritmo otimizado para maximizar aproveitamento do espaço
      const organizeTagsOptimized = (tags) => {
        // Classificar tags por tamanho mais refinado
        const tiny = tags.filter(t => t.name.length <= 4);       // Muito pequenas
        const small = tags.filter(t => t.name.length > 4 && t.name.length <= 8);  // Pequenas
        const medium = tags.filter(t => t.name.length > 8 && t.name.length <= 15); // Médias  
        const large = tags.filter(t => t.name.length > 15);      // Grandes
        
        // Estratégia inteligente: priorizar combinações que cabem juntas
        const result = [];
        
        // Primeiro, adiciona todas as tiny + small (que cabem várias por linha)
        let tinyIndex = 0, smallIndex = 0, mediumIndex = 0, largeIndex = 0;
        
        // Combinar tiny e small primeiro (até 3 por vez)
        while (tinyIndex < tiny.length || smallIndex < small.length) {
          let lineLength = 0;
          
          // Adiciona até 3 tiny/small que cabem na linha
          for (let i = 0; i < 3; i++) {
            if (tinyIndex < tiny.length && lineLength + tiny[tinyIndex].name.length <= 25) {
              result.push(tiny[tinyIndex]);
              lineLength += tiny[tinyIndex].name.length;
              tinyIndex++;
            } else if (smallIndex < small.length && lineLength + small[smallIndex].name.length <= 25) {
              result.push(small[smallIndex]);
              lineLength += small[smallIndex].name.length;
              smallIndex++;
            } else {
              break;
            }
          }
          
          // Se não conseguiu adicionar nada, para o loop
          if (lineLength === 0) break;
        }
        
        // Depois adiciona medium e large normalmente
        while (mediumIndex < medium.length || largeIndex < large.length) {
          if (mediumIndex < medium.length) {
            result.push(medium[mediumIndex++]);
          }
          if (largeIndex < large.length) {
            result.push(large[largeIndex++]);
          }
        }
        
        return result;
      };
    
      const optimizedTags = organizeTagsOptimized(card.tags);
    
      return optimizedTags.map((tag, index) => {
        // Determina se a tag é muito longa (mais que 30 caracteres - mais permissivo)
        const isVeryLong = tag.name.length > 30;
        const truncatedName = isVeryLong ? `${tag.name.substring(0, 27)}...` : tag.name;
        
        const chipElement = (
          <Chip
            key={`${tag.id}-${index}`}
            label={truncatedName}
            size="small"
            style={{
              backgroundColor: `${tag.color}1A` || '#e3f2fd1A',
              color: tag.color || '#1976d2',
              fontSize: '0.65rem',
              height: '20px',
              // Largura natural, sem forçar truncamento
              flexShrink: 0,
              flexGrow: 0,
              minWidth: 'auto',
              maxWidth: isVeryLong ? '250px' : '100%',
              // Ajuste de padding baseado no tamanho
              paddingLeft: tag.name.length <= 6 ? '6px' : '8px',
              paddingRight: tag.name.length <= 6 ? '6px' : '8px',
            }}
            icon={<LocalOffer style={{ fontSize: '12px', color: tag.color || '#1976d2' }} />}
          />
        );
        
        // Se a tag foi truncada, envolve com Tooltip
        return isVeryLong ? (
          <Tooltip key={`${tag.id}-${index}`} title={tag.name} placement="top">
            {chipElement}
          </Tooltip>
        ) : chipElement;
      });
    })()}
  </div>
)}


      {/* Footer com usuário e botão */}
      <div className="card-footer">
        <div className="card-user">
          <Person style={{ fontSize: '14px' }} />
          <Typography className="user-name">
            {card.user}
          </Typography>
        </div>
        <Tooltip title="Enviar mensagem">
          <IconButton 
            className="send-button" 
            size="small"
            onClick={handleSendMessage}
          >
            <Send style={{ fontSize: '14px' }} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Indicador de mensagens não lidas */}
      {card.unread > 0 && (
        <div className="unread-badge">
          {card.unread}
        </div>
      )}
    </div>
  );
};

// Componente da Coluna Modernizado
const KanbanColumn = ({ column, children, isCollapsed, onToggleCollapse }) => {
  // Drag das colunas habilitado
  const {
    attributes: columnAttributes,
    listeners: columnListeners,
    setNodeRef: setSortableNodeRef,
    transform: columnTransform,
    transition: columnTransition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `droppable-${column.id}`,
    data: {
      type: 'column',
      column,
    },
  });

  // Remover estilos de drag das colunas temporariamente
  const columnStyle = {
    transform: CSS.Transform.toString(columnTransform),
    transition: columnTransition,
    opacity: isColumnDragging ? 0.5 : 1,
  };

  // Determinar se a coluna tem cards ou está vazia
  const hasCards = column.cards && column.cards.length > 0;
  const columnClass = `kanban-column ${hasCards ? 'has-cards' : 'empty-column'} ${isCollapsed ? 'collapsed' : ''}`;

  return (
    <div
      ref={(node) => {
        setDroppableNodeRef(node);
        setSortableNodeRef(node);
      }}
      className={columnClass}
      style={columnStyle}
    >
      {/* Header da coluna */}
      <div
        className="column-header"
        style={{ borderTop: `4px solid ${column.color}`, position: 'relative' }}
        {...columnAttributes} 
        {...columnListeners}
      >
        {/* Contador no canto superior direito */}
        {!isCollapsed && (
          <Typography className="column-count-corner">
            {column.cards.length}
          </Typography>
        )}
        <div className="column-title-section">
          {!isCollapsed && (
            <div className="column-title-container">
              <Typography className="column-title">
                {column.title}
              </Typography>
              {column.funnel && (
                <Chip
                  label={column.funnel}
                  size="small"
                  className="funnel-badge"
                  style={{
                    backgroundColor: column.color,
                    color: '#fff',
                    fontSize: '0.55rem',
                    height: '16px',
                    marginTop: '4px',
                  }}
                />
              )}
            </div>
          )}
          {isCollapsed && (
            <Typography className="column-title-collapsed">
              {column.title}
            </Typography>
          )}
        </div>
        
        <div className="column-header-actions">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(column.id);
            }}
            className="collapse-button"
          >
            {isCollapsed ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
          </IconButton>
        </div>
      </div>

      {/* Container dos cards */}
      {!isCollapsed && (
        <div className="column-content">
          {children}
        </div>
      )}
    </div>
  );
};

const useStyles = () => ({
  '@global': {
    // Animação de spin
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    
    // Estilos globais modernos
    '.kanban-container': {
      display: 'flex',
      overflowX: 'auto',
      overflowY: 'hidden',
      height: '100%',
      padding: '16px 16px 0 16px', // <--- adiciona 16px só em cima
      gap: '16px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#c1c1c1 #f1f1f1',
      '&::-webkit-scrollbar': {
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '4px',
        '&:hover': {
          background: '#a8a8a8',
        },
      },
    },
    
    // Colunas modernizadas com altura dinâmica
    '.kanban-column': {
      minWidth: '280px',
      maxWidth: '280px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      minHeight: '100px',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        minWidth: '240px',
        maxWidth: '240px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        minWidth: '200px',
        maxWidth: '200px',
      },
      
          '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)',
      },
      // Altura dinâmica baseada no conteúdo
      '&.empty-column': {
        height: '100px',
      },
      '&.has-cards': {
        height: 'auto',
        maxHeight: '60vh',
      },
      // Estilo para colunas colapsadas
      '&.collapsed': {
        width: 'fit-content', // Largura baseada no conteúdo
        minWidth: '70px',     // Mínimo para não ficar muito pequeno
        maxWidth: '150px',    // Máximo para textos muito longos
        height: '220px', // Altura fixa e menor
        minHeight: '220px',
        maxHeight: '220px',
        backgroundColor: '#fff', // Fundo branco para a coluna colapsada
        
        // Responsividade para colunas colapsadas
        '@media (max-width: 1600px)': {
          minWidth: '60px',
          maxWidth: '120px',
          height: '200px',
          minHeight: '200px',
          maxHeight: '200px',
        },
        
        '@media (max-width: 1366px)': {
          minWidth: '50px',
          maxWidth: '100px',
          height: '180px',
          minHeight: '180px',
          maxHeight: '180px',
        },
        
        '& .column-header': {
          padding: '8px 4px',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', // Centralizado
          height: '100%', // Usa toda a altura disponível
          backgroundColor: '#fff', // Garante fundo branco
          borderRadius: '12px', // Bordas arredondadas
        },
        '& .column-title-section': {
          width: '100%',
          justifyContent: 'center',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        },
        '& .column-title-collapsed': {
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#2c3e50',
          textAlign: 'center',
          whiteSpace: 'nowrap',    // Não quebra linha
          wordBreak: 'keep-all',   // Mantém palavras inteiras
          lineHeight: '1.2',
          padding: '8px 4px',
          width: '100%',
          overflow: 'visible',     // Permite texto visível
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          
          // Responsividade para texto colapsado
          '@media (max-width: 1600px)': {
            fontSize: '0.7rem',
            padding: '6px 3px',
          },
          
          '@media (max-width: 1366px)': {
            fontSize: '0.65rem',
            padding: '4px 2px',
          },
        },
        '& .column-header-actions': {
          marginTop: '8px',
        },
      },
    },
    
    // Header das colunas
    '.column-header': {
      padding: '16px',
      backgroundColor: '#fff',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'grab',
      userSelect: 'none',
      borderBottom: '1px solid #e9ecef',
      flexShrink: 0,
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        padding: '12px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        padding: '10px',
      },
      
      '&:active': {
        cursor: 'grabbing',
      },
    },
    
    '.column-header-actions': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    
    '.collapse-button': {
      padding: '4px',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    
    '.column-title-section': {
      display: 'flex',
      alignItems: 'center', // Centralizado verticalmente
      justifyContent: 'center', // Centralizado horizontalmente
      flex: 1,
    },
    
    '.column-title-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Centralizado horizontalmente
      gap: '4px',
      flex: 1,
      textAlign: 'center',
    },
    
    '.funnel-badge': {
      alignSelf: 'center', // Centralizado
      opacity: 0.9,
      '&:hover': {
        opacity: 1,
      },
    },
    
    '.column-title': {
      fontWeight: '600',
      textAlign: 'center', // Título centralizado
      width: '100%',
      fontSize: '0.95rem',
      color: '#2c3e50',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        fontSize: '0.9rem',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        fontSize: '0.85rem',
      },
    },
    
    '.column-count': {
      backgroundColor: '#e9ecef',
      color: '#6c757d',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '500',
      minWidth: '24px',
      textAlign: 'center',
    },
    
    '.column-count-corner': {
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      backgroundColor: "#1976d2",
      color: 'white',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '0.7rem',
      fontWeight: '600',
      minWidth: '20px',
      textAlign: 'center',
      zIndex: 15,
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    
    // Área de conteúdo das colunas
    '.column-content': {
      flex: 1,
      padding: '12px',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'thin',
      scrollbarColor: '#c1c1c1 transparent',
      minHeight: 0,
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        padding: '10px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        padding: '8px',
      },
      
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '2px',
      },
    },
    
    // Cards modernizados
    '.kanban-card': {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      cursor: 'grab',
      transition: 'all 0.2s ease',
      position: 'relative',
      border: '1px solid #e9ecef',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        padding: '10px',
        marginBottom: '6px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        padding: '8px',
        marginBottom: '5px',
      },
      
      '&:hover': {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-1px)',
        borderColor: '#dee2e6',
      },
      '&:active': {
        cursor: 'grabbing',
      },
    },
    
    // Header do card - Layout responsivo
    '.card-header': {
      marginBottom: '8px',
      paddingBottom: '6px',
      borderBottom: '1px solid #f1f3f4',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        marginBottom: '6px',
        paddingBottom: '4px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        marginBottom: '5px',
        paddingBottom: '3px',
      },
    },
    
    '.card-contact-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      width: '100%',
    },
    
    '.card-contact': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      minWidth: 0, // Permite que o flex funcione corretamente
    },
    
    '.card-phone': {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#495057',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        fontSize: '0.7rem',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        fontSize: '0.65rem',
      },
    },
    
    '.card-ticket': {
      fontSize: '0.65rem',
      color: '#6c757d',
      fontWeight: '500',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        fontSize: '0.6rem',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        fontSize: '0.55rem',
      },
    },
    
    // Título do card
    '.card-title': {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '6px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        fontSize: '0.8rem',
        marginBottom: '5px',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        fontSize: '0.75rem',
        marginBottom: '4px',
      },
    },
    
    // Descrição do card
    '.card-description': {
      fontSize: '0.75rem',
      color: '#6c757d',
      lineHeight: '1.3',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      
      // Responsividade para 1600x900
      '@media (max-width: 1600px)': {
        fontSize: '0.7rem',
        marginBottom: '6px',
        lineHeight: '1.2',
      },
      
      // Responsividade para 1366x768
      '@media (max-width: 1366px)': {
        fontSize: '0.65rem',
        marginBottom: '5px',
        lineHeight: '1.2',
      },
    },
    
    // Tags do card (controle rigoroso de overflow)
    '.card-tags': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '3px',
      marginBottom: '8px',
      alignItems: 'flex-start',
      alignContent: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
      overflow: 'hidden', // Garante que nada vaze
      
      // Responsividade para 1366x768 - controle mais rigoroso
      '@media (max-width: 1366px)': {
        gap: '2px',
        marginBottom: '6px',
      },
      
      // Permite que as tags usem o espaço natural mas com limites
      '& > *': {
        flexGrow: 0,
        flexShrink: 1, // Permite encolher se necessário
        maxWidth: '100%', // Nunca pode passar da largura do container
        minWidth: 0, // Permite encolher completamente se necessário
      },
      
      // Controle específico dos chips
      '& .MuiChip-root': {
        maxWidth: '100%',
        overflow: 'hidden',
        
        // Na resolução 1366x768, tags ficam menores
        '@media (max-width: 1366px)': {
          height: '18px',
          fontSize: '0.6rem',
          '& .MuiChip-label': {
            paddingLeft: '4px',
            paddingRight: '4px',
          },
          '& .MuiChip-icon': {
            fontSize: '10px',
          },
        },
        
        '& .MuiChip-label': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        },
      },
    },
    
    // Footer do card
    '.card-footer': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '6px',
      borderTop: '1px solid #f1f3f4',
    },
    
    '.card-user': {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#f8f9fa',
      padding: '4px 8px',
      borderRadius: '12px',
      border: '1px solid #e9ecef',
    },
    
    '.user-name': {
      fontSize: '0.65rem',
      fontWeight: '500',
      color: '#495057',
    },
    
    '.send-button': {
      backgroundColor: '#e8f5e8',
      color: '#28a745',
      border: '1px solid #28a745',
      width: '28px',
      height: '28px',
      '&:hover': {
        backgroundColor: '#28a745',
        color: '#fff',
      },
    },
    
    // Badge de mensagens não lidas
    '.unread-badge': {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#dc3545',
      color: '#fff',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.6rem',
      fontWeight: '600',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    
    // Overlay de drag
    '.drag-overlay': {
      transform: 'rotate(3deg)',
      opacity: 0.9,
      zIndex: 1000,
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
    }
  },
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "calc(100vh - 48px)",
    padding: 0,
    overflowY: "auto",
    backgroundColor: "#f5f5f5",
  },
  addButton: {
    backgroundColor: "#00C307",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "8px 16px",
    fontSize: "0.875rem",
    "&:hover": {
      backgroundColor: "#00A006",
    },
    
    // Responsividade
    '@media (max-width: 1600px)': {
      padding: "6px 12px",
      fontSize: "0.8rem",
    },
    
    '@media (max-width: 1366px)': {
      padding: "5px 10px",
      fontSize: "0.75rem",
    },
  },
  header: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: '12px',
    marginBottom: '12px',
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    minHeight: "60px", // Altura mínima reduzida
    
    // Responsividade para resoluções menores
    '@media (max-width: 1600px)': {
      padding: '8px',
      marginBottom: '8px',
      minHeight: "50px",
    },
    
    '@media (max-width: 1366px)': {
      padding: '6px',
      marginBottom: '6px',
      minHeight: "45px",
    },
  },
  headerCenter: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px', // Reduzido de 16px para 12px
    
    // Responsividade
    '@media (max-width: 1600px)': {
      gap: '8px',
    },
    
    '@media (max-width: 1366px)': {
      gap: '6px',
    },
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  badgesContainer: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  smallBadge: {
    height: '18px',
    fontSize: '0.65rem',
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px',
    },
  },
  title: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "1.5rem",
  },
  subtitle: {
    color: "#6c757d",
    fontSize: "0.9rem",
    marginTop: "4px",
  },
  kanbanWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    maxHeight: "100%",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: '16px',
    overflow: "hidden",
  },
  
  // Estilos para ícones de confirmação (ack)
  ackIcons: {
    fontSize: 12,
    verticalAlign: "middle",
    marginLeft: 4,
    color: '#666'
  },
  
  ackDoneAllIcon: {
    color: '#4fc3f7',
    fontSize: 12,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  
  ackPlayedIcon: {
    color: '#25D366',
    fontSize: 12,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  
  boardContainer: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    
    // Responsividade para melhor aproveitamento do espaço
    '@media (max-width: 1600px)': {
      // Otimização para 1600x900
    },
    
    '@media (max-width: 1366px)': {
      // Otimização para 1366x768
    },
  },
  // Estilos responsivos para campos de filtro (DINÂMICOS)
  filterField: {
    marginRight: 16,
    minWidth: '160px',
    width: 'auto', // Largura automática
    display: 'flex',
    
    // Bordas mais arredondadas
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px !important', // Mais arredondado
    },
    '& .MuiInputBase-root': {
      borderRadius: '20px !important',
    },
    
    // Garante espaço suficiente para a setinha
    '& .MuiSelect-root': {
      paddingRight: '32px !important', // Espaço extra para a setinha
    },
    '& .MuiSelect-select': {
      paddingRight: '32px !important', // Garante espaço para a setinha
      whiteSpace: 'nowrap', // Evita quebra de linha
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .MuiSelect-icon': {
      right: '8px', // Posiciona a setinha corretamente
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      marginRight: 12,
      minWidth: '140px !important',
      '& .MuiInputBase-input': {
        fontSize: '0.8rem',
        padding: '8px 12px',
        paddingRight: '28px !important',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.8rem',
      },
      '& .MuiSelect-select': {
        fontSize: '0.8rem',
        padding: '8px 12px',
        paddingRight: '28px !important',
      },
      '& .MuiSelect-icon': {
        right: '6px',
      },
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      marginRight: 8,
      minWidth: '120px !important',
      '& .MuiInputBase-input': {
        fontSize: '0.75rem',
        padding: '6px 10px',
        paddingRight: '24px !important',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.75rem',
      },
      '& .MuiSelect-select': {
        fontSize: '0.75rem',
        padding: '6px 10px',
        paddingRight: '24px !important',
      },
      '& .MuiSelect-icon': {
        right: '4px',
      },
      '& .MuiChip-root': {
        fontSize: '0.6rem',
        height: '16px',
        padding: '1px 4px',
      },
    },
  },
  dateField: {
    marginRight: 16,
    width: '180px', // Aumentado de 160px para 180px
    
    // Bordas mais arredondadas
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px !important', // Mais arredondado
    },
    '& .MuiInputBase-root': {
      borderRadius: '20px !important',
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      marginRight: 12,
      width: '160px', // Aumentado de 140px para 160px
      '& .MuiInputBase-input': {
        fontSize: '0.8rem',
        padding: '8px 12px',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.8rem',
      },
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      marginRight: 8,
      width: '140px', // Aumentado de 120px para 140px
      '& .MuiInputBase-input': {
        fontSize: '0.75rem',
        padding: '6px 10px',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.75rem',
      },
    },
  },
  // Estilos para o filtro de avatares
  userAvatarFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginRight: '16px',
    flexWrap: 'nowrap', // Evita quebra de linha
    flexDirection: 'row', // Força direção horizontal
    position: 'relative',
    height: '44px', // Altura aumentada para não cortar o efeito de crescimento
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      gap: '6px',
      marginRight: '12px',
      height: '40px',
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      gap: '4px',
      marginRight: '8px',
      height: '36px',
    },
  },
  avatarCarousel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px', // Aumentado de 8px para 12px para mais espaço entre setas e avatares
    position: 'relative',
    height: '44px', // Altura aumentada para não cortar o efeito de crescimento
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      gap: '10px', // Aumentado de 6px para 10px
      height: '40px',
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      gap: '8px', // Aumentado de 4px para 8px
      height: '36px',
    },
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Centraliza os avatares dentro do container
    gap: '8px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    height: '44px', // Altura aumentada para não cortar o efeito de crescimento
    width: '180px', // Largura fixa para mostrar 4 avatares completos (32px * 4 + gaps)
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      gap: '6px',
      height: '40px',
      width: '150px', // Ajustado para avatares menores (28px * 4 + gaps)
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      gap: '4px',
      height: '36px',
      width: '120px', // Ajustado para avatares menores (24px * 4 + gaps)
    },
  },
  avatarNavButton: {
    minWidth: '28px', // Aumentado para ficar redondo
    width: '28px',
    height: '28px', // Igual à largura para ficar redondo
    maxWidth: '28px', // Força o tamanho exato
    maxHeight: '28px', // Força o tamanho exato
    padding: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: '#666',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0, // Impede que o botão seja comprimido
    
    '&:hover': {
      backgroundColor: 'rgba(0, 195, 7, 0.1)',
      color: '#00C307',
      borderColor: 'rgba(0, 195, 7, 0.3)',
      transform: 'scale(1.1)',
    },
    
    '&:disabled': {
      opacity: 0.3,
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        color: '#666',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        transform: 'none',
      },
    },
    
    '& .MuiSvgIcon-root': {
      fontSize: '14px',
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      minWidth: '24px',
      width: '24px',
      height: '24px', // Igual à largura para ficar redondo
      maxWidth: '24px', // Força o tamanho exato
      maxHeight: '24px', // Força o tamanho exato
      '& .MuiSvgIcon-root': {
        fontSize: '12px',
      },
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      minWidth: '20px',
      width: '20px',
      height: '20px', // Igual à largura para ficar redondo
      maxWidth: '20px', // Força o tamanho exato
      maxHeight: '20px', // Força o tamanho exato
      '& .MuiSvgIcon-root': {
        fontSize: '10px',
      },
    },
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    fontSize: '0.8rem',
    
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      width: '28px',
      height: '28px',
      fontSize: '0.75rem',
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      width: '24px',
      height: '24px',
      fontSize: '0.7rem',
    },
  },
  userAvatarSelected: {
    border: '2px solid #00C307',
    boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.2)',
  },
  selectAllAvatar: {
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    border: '2px solid #007bff',
    transition: 'all 0.2s ease',
    fontSize: '0.8rem',
    backgroundColor: '#007bff',
    color: '#fff',
    marginRight: '8px',
    
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
      backgroundColor: '#0056b3',
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      width: '28px',
      height: '28px',
      fontSize: '0.75rem',
      marginRight: '6px',
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      width: '24px',
      height: '24px',
      fontSize: '0.7rem',
      marginRight: '4px',
    },
  },
  selectAllAvatarActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    
    '&:hover': {
      backgroundColor: '#1e7e34',
    },
  },
  clearFilterButton: {
    minWidth: 'auto',
    width: '32px',
    height: '32px',
    padding: '4px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: '1px solid #ddd',
    marginLeft: '4px',
    
    '&:hover': {
      backgroundColor: '#e0e0e0',
      color: '#333',
    },
    
    // Responsividade para 1600x900
    '@media (max-width: 1600px)': {
      width: '28px',
      height: '28px',
      padding: '3px',
    },
    
    // Responsividade para 1366x768
    '@media (max-width: 1366px)': {
      width: '24px',
      height: '24px',
      padding: '2px',
      '& .MuiSvgIcon-root': {
        fontSize: '1rem',
      },
    },
  },
});

const Kanban = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const history = useHistory();

  // Estados básicos
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de filtros
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Estados de dados
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [funnels, setFunnels] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [columnOrder, setColumnOrder] = useState([]);
  
  // Estados para drag horizontal do container
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [lastX, setLastX] = useState(0);
  const kanbanContainerRef = useRef(null);
  
  // Estados para o modal de mensagem
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const recorder = useRef(null);
  const recordingInterval = useRef(null);
  const isMounted = useRef(true);
  
  // Cleanup do isMounted
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Inicializar MicRecorder usando o polyfill
  useEffect(() => {
    const initMicRecorder = () => {
      try {
        if (typeof window !== 'undefined' && window.global && typeof window.global.MicRecorder === 'function') {
          Mp3Recorder = new window.global.MicRecorder({ bitRate: 128 });
          console.log("✅ MicRecorder global inicializado no Kanban");
        } else {
          throw new Error("window.global.MicRecorder não disponível");
        }
      } catch (error) {
        console.warn("⚠️ Kanban usando MicRecorder mock:", error.message);
        Mp3Recorder = {
          start: () => Promise.resolve(),
          stop: () => ({ 
            getMp3: () => Promise.resolve([new Blob(), new Uint8Array()]) 
          }),
          getMp3: () => Promise.resolve([new Blob(), new Uint8Array()])
        };
      }
    };
    
    setTimeout(initMicRecorder, 100);
  }, []);
  
  // Estados para funcionalidades do chat
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [privateMessage, setPrivateMessage] = useState(false);
  const [signMessage, setSignMessage] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [senVcardModalOpen, setSenVcardModalOpen] = useState(false);
  const [modalCameraOpen, setModalCameraOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [mediasUpload, setMediasUpload] = useState([]);
  const [showModalMedias, setShowModalMedias] = useState(false);
  
  // Estados para controle de inicialização
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [ticketsCache, setTicketsCache] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(0);
  const [lastInstantFilter, setLastInstantFilter] = useState(null);
  
  // Estados para carrossel de avatares
  const [avatarStartIndex, setAvatarStartIndex] = useState(0);
  const maxVisibleAvatars = 4;
  

  
  // Paleta de cores para os badges dos funis
  const funnelColors = [
    '#FFB300', // amarelo
    '#1E88E5', // azul
    '#43A047', // verde
    '#E53935', // vermelho
    '#8E24AA', // roxo
    '#F4511E', // laranja
    '#00ACC1', // ciano
    '#3949AB', // azul escuro
    '#6D4C41', // marrom
    '#757575', // cinza
  ];

  // Dados de exemplo para os cards (mantendo os cards fake por enquanto)
  const [columns, setColumns] = useState([]);

  // Função para buscar dados iniciais
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar dados em paralelo
      await Promise.all([
        fetchFunnels(),
        fetchAllTags(),
        user?.profile === 'admin' ? fetchAllUsers() : Promise.resolve(),
      ]);
          
          // Preferências serão carregadas após definir as colunas no fetchTags
      
      // Marcar carregamento inicial como completo
      setInitialLoadComplete(true);
      
    } catch (error) {
      console.error("Erro no carregamento inicial:", error);
      toast.error("Erro ao carregar dados do Kanban");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Função para carregar preferências salvas do usuário
  const loadUserPreferences = () => {
    if (user) {
      // Carregar funil selecionado (incluindo null para "Todos os Funis")
      if (user.hasOwnProperty('kanbanSelectedFunnel')) {
        setSelectedFunnel(user.kanbanSelectedFunnel);
      }
      
      // Carregar colunas colapsadas
      if (user.hasOwnProperty('kanbanCollapsedColumns')) {
        console.log('Carregando colunas colapsadas:', user.kanbanCollapsedColumns);
        setCollapsedColumns(new Set(user.kanbanCollapsedColumns || []));
      }
      
      // Carregar ordem das colunas
      if (user.hasOwnProperty('kanbanColumnOrder') && user.kanbanColumnOrder?.length > 0) {
        console.log('Carregando ordem das colunas:', user.kanbanColumnOrder);
        setColumnOrder(user.kanbanColumnOrder);
      } else {
        // Inicializar com ordem atual das colunas se não houver ordem salva
        const currentOrder = columns.map(col => col.id);
        console.log('Inicializando ordem com colunas atuais:', currentOrder);
        setColumnOrder(currentOrder);
      }
    }
  };

  // Função para salvar filtros do usuário
  const saveKanbanFilters = async (funnel, tags, users) => {
    try {
      await api.put(`/users/${user.id}/kanban-filters`, {
        kanbanSelectedFunnel: funnel,
        kanbanSelectedTags: tags?.map(tag => tag.id) || null,
        kanbanSelectedUsers: users?.map(user => user.id) || null
      });
    } catch (error) {
      console.error('Erro ao salvar filtros do Kanban:', error);
    }
  };

  // Função para salvar preferências de colunas
  const saveColumnPreferences = async () => {
    if (!user?.id) return;
    
    try {
      await api.put(`/users/${user.id}/kanban-filters`, {
        kanbanCollapsedColumns: Array.from(collapsedColumns),
        kanbanColumnOrder: columnOrder
      });
    } catch (error) {
      console.error('Erro ao salvar preferências de colunas:', error);
    }
  };

  // Função para salvar preferências com estado específico
  const saveColumnPreferencesWithState = async (collapsedSet) => {
    if (!user?.id) return;
    
    try {
      const data = {
        kanbanCollapsedColumns: Array.from(collapsedSet),
        kanbanColumnOrder: columnOrder
      };
      
      await api.put(`/users/${user.id}/kanban-filters`, data);
    } catch (error) {
      console.error('Erro ao salvar preferências de colunas:', error);
    }
  };

  // Função para buscar funis
  const fetchFunnels = async () => {
    try {
      const { data } = await api.get("/funilkanban");
      setFunnels(data.funilKanbans || []);
      return data.funilKanbans || [];
    } catch (error) {
      console.error("Erro ao buscar funis:", error);
      return [];
    }
  };

  // Função para buscar todas as tags
  const fetchAllTags = async () => {
    try {
      const response = await api.get("/tags/list");
      setAllTags(response.data || []);
      return response.data || [];
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  // Função para buscar todos os usuários (apenas admin) - Usando endpoint completo
  const fetchAllUsers = async () => {
    try {
      // Usando o mesmo endpoint da página de usuários que funciona
      const response = await api.get("/users/", {
        params: { searchParam: "", pageNumber: 1 }
      });
      const users = response.data.users || [];
      setAllUsers(users);
      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  // Função para calcular cor do texto baseada na cor de fundo
  const getTextColor = (backgroundColor) => {
    if (!backgroundColor) return '#333';
    
    // Remove # se existir
    const hex = backgroundColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcula luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retorna cor do texto baseada na luminância
    return luminance > 0.5 ? '#333' : '#fff';
  };

  // Funções para navegação do carrossel de avatares
  const handlePreviousAvatars = () => {
    setAvatarStartIndex(prev => Math.max(0, prev - maxVisibleAvatars));
  };

  const handleNextAvatars = () => {
    setAvatarStartIndex(prev => 
      Math.min(allUsers.length - maxVisibleAvatars, prev + maxVisibleAvatars)
    );
  };

  // Função para scroll do mouse nos avatares
  const handleAvatarScroll = (event) => {
    event.preventDefault();
    const delta = event.deltaY;
    
    if (delta > 0) {
      // Scroll para baixo = próximo
      if (canNavigateNext) {
        handleNextAvatars();
      }
    } else {
      // Scroll para cima = anterior
      if (canNavigatePrevious) {
        handlePreviousAvatars();
      }
    }
  };

  const canNavigatePrevious = avatarStartIndex > 0;
  const canNavigateNext = avatarStartIndex + maxVisibleAvatars < allUsers.length;
  const shouldShowNavigation = allUsers.length > maxVisibleAvatars;

  // Função para selecionar/deselecionar todos os usuários
  const handleSelectAllUsers = () => {
    const allSelected = selectedUsers.length === allUsers.length;
    
    let newSelection;
    if (allSelected) {
      // Deseleciona todos
      newSelection = [];
    } else {
      // Seleciona todos
      newSelection = [...allUsers];
    }
    
    // Atualiza o estado
    setSelectedUsers(newSelection);
    
    // 💾 SALVA FILTROS IMEDIATAMENTE - Para persistir no usuário logado
    if (user && initialLoadComplete) {
      saveKanbanFilters(selectedFunnel, selectedTags, newSelection);
    }
    
    // ⚡ FILTRO INSTANTÂNEO - Executa imediatamente com a nova seleção
    setLastInstantFilter(Date.now());
    filterTicketsInstantly(newSelection);
  };



  // Função para buscar tickets reais
  const fetchTickets = useCallback(async () => {
    // Cache inteligente - reutiliza por 10 segundos
    const now = Date.now();
    if (ticketsCache && (now - cacheTimestamp) < 10000) {
      return;
    }
    
    try {
      const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
      const params = {
        queueIds: JSON.stringify(jsonString),
        startDate,
        endDate
      };

      // Só adiciona os parâmetros se houver valores válidos
      if (selectedFunnel) {
        params.funilId = selectedFunnel;
      }
      
      if (selectedTags.length > 0) {
        params.tags = JSON.stringify(selectedTags.map(tag => tag.id));
      }
      
      // Se nenhum usuário estiver selecionado, filtra apenas pelo usuário logado
      // Se houver usuários selecionados, usa a seleção
      if (selectedUsers.length > 0) {
        params.users = JSON.stringify(selectedUsers.map(user => user.id));
      } else if (user?.id) {
        // Filtra apenas pelo usuário logado quando nenhum avatar estiver selecionado
        params.users = JSON.stringify([user.id]);
      }
      
      const { data } = await api.get("/ticket/kanban", { params });
      setTickets(data.tickets || []);
      
      // Atualizar cache
      setTicketsCache(data.tickets || []);
      setCacheTimestamp(Date.now());
      
    } catch (err) {
      console.error("Erro ao buscar tickets:", err);
      setTickets([]);
    }
  }, [user?.queues, startDate, endDate, selectedFunnel, selectedTags, selectedUsers]);

  // Função otimizada que retorna os tickets diretamente
  const fetchTicketsAndReturn = async () => {
    try {
      const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
      const params = {
        queueIds: JSON.stringify(jsonString),
        startDate,
        endDate
      };

      if (selectedFunnel) {
        params.funilId = selectedFunnel;
      }
      
      if (selectedTags.length > 0) {
        params.tags = JSON.stringify(selectedTags.map(tag => tag.id));
      }
      
      // Se nenhum usuário estiver selecionado, filtra apenas pelo usuário logado
      // Se houver usuários selecionados, usa a seleção
      if (selectedUsers.length > 0) {
        params.users = JSON.stringify(selectedUsers.map(user => user.id));
      } else if (user?.id) {
        // Filtra apenas pelo usuário logado quando nenhum avatar estiver selecionado
        params.users = JSON.stringify([user.id]);
      }

      const { data } = await api.get("/ticket/kanban", { params });
      const ticketsResult = data.tickets || [];
      
      // Atualizar estado também
      setTickets(ticketsResult);
      
      return ticketsResult;
      
    } catch (err) {
      console.error("Erro ao buscar tickets:", err);
      setTickets([]);
      return [];
    }
  };



    // ⚡ Função para filtro instantâneo (executa imediatamente com nova seleção)
  const filterTicketsInstantly = useCallback(async (instantUserSelection) => {
    try {
      // Busca tickets com a nova seleção instantaneamente
      const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
      const params = {
        queueIds: JSON.stringify(jsonString),
        startDate,
        endDate
      };

      if (selectedFunnel) {
        params.funilId = selectedFunnel;
      }
      
      if (selectedTags.length > 0) {
        params.tags = JSON.stringify(selectedTags.map(tag => tag.id));
      }
      
      // Aplica filtro com a nova seleção INSTANTÂNEA
      if (instantUserSelection.length > 0) {
        params.users = JSON.stringify(instantUserSelection.map(u => u.id));
      } else if (user?.id) {
        params.users = JSON.stringify([user.id]);
      }

      const { data } = await api.get("/ticket/kanban", { params });
      const ticketsResult = data.tickets || [];
      
      // Processa as tags e colunas com os tickets filtrados
      await processTagsWithTickets(ticketsResult);
      
    } catch (error) {
      console.error('❌ Erro no filtro instantâneo:', error);
    }
  }, [user?.queues, startDate, endDate, selectedFunnel, selectedTags, user]);

       // ⚡ Função para filtro instantâneo de TAGS
    const filterTicketsInstantlyWithTags = useCallback(async (instantTagSelection) => {
      try {
        // Busca tickets com a nova seleção de tags instantaneamente
        const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
        const params = {
          queueIds: JSON.stringify(jsonString),
          startDate,
          endDate
        };

        if (selectedFunnel) {
          params.funilId = selectedFunnel;
        }
        
        // Aplica filtro com a nova seleção INSTANTÂNEA de tags
        if (instantTagSelection.length > 0) {
          params.tags = JSON.stringify(instantTagSelection.map(tag => tag.id));
        }
        
        // Filtro de usuários (usa o estado atual)
        if (selectedUsers.length > 0) {
          params.users = JSON.stringify(selectedUsers.map(u => u.id));
        } else if (user?.id) {
          params.users = JSON.stringify([user.id]);
        }

        const { data } = await api.get("/ticket/kanban", { params });
        const ticketsResult = data.tickets || [];
        
        // Processa as tags e colunas com os tickets filtrados
        await processTagsWithTickets(ticketsResult);
        
      } catch (error) {
        console.error('❌ TAGS - Erro no filtro instantâneo:', error);
      }
    }, [user?.queues, startDate, endDate, selectedFunnel, selectedUsers, user]);

   // Função auxiliar para processar tags com tickets específicos
  const processTagsWithTickets = useCallback(async (ticketsData) => {
    try {
      const response = await api.get("/tag/kanban/", {
        params: { funilId: selectedFunnel }
      });
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      
      // Funções auxiliares inline para processar dados
      const formatPhoneNumberInline = (phoneNumber) => {
        if (!phoneNumber) return '';
        let cleanNumber = phoneNumber.replace(/^\+?55/, '').replace(/\D/g, '');
        if (cleanNumber.length === 10 && ['6', '7', '8', '9'].includes(cleanNumber[2])) {
          cleanNumber = cleanNumber.slice(0, 2) + '9' + cleanNumber.slice(2);
        }
        if (cleanNumber.length === 11) {
          return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.charAt(2)} ${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
        }
        if (cleanNumber.length === 10) {
          return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
        }
        return phoneNumber;
      };
      
      const getNormalTagsInline = (ticket) => {
        let normalTags = [];
        if (ticket.contact && ticket.contact.tags) {
          const contactNormalTags = ticket.contact.tags.filter(tag => tag.kanban === 0);
          normalTags = [...normalTags, ...contactNormalTags];
        }
        if (ticket.tags) {
          const ticketNormalTags = ticket.tags.filter(tag => tag.kanban === 0);
          normalTags = [...normalTags, ...ticketNormalTags];
        }
        return normalTags.filter((tag, index, self) => 
          index === self.findIndex(t => t.id === tag.id)
        );
      };
      
      const lanes = [];
      
      // Tickets sem tags (Em aberto)
      const filteredTickets = ticketsData.filter(ticket => ticket.tags.length === 0);
      const emptyLane = {
        id: "lane0",
        title: "Em aberto",
        color: '#6c757d',
        funnel: null,
        cards: filteredTickets.map(ticket => ({
          id: ticket.id.toString(),
          title: ticket.contact.name,
          description: '',
          phone: formatPhoneNumberInline(ticket.contact.number),
          ticketId: `#${ticket.id}`,
          user: ticket.user?.name || '',
          tags: getNormalTagsInline(ticket),
          unread: ticket.unreadMessages || 0,
          ticketData: ticket
        }))
      };
      lanes.push(emptyLane);
      
      // Processar tags com tickets
      fetchedTags.forEach((tag) => {
        const funilIndex = funnels.findIndex(f => f.id === tag.funilId);
        const funilName = funnels[funilIndex]?.name;
        const funilColor = funilIndex >= 0 ? funnelColors[funilIndex % funnelColors.length] : '#e0e0e0';
        
        const tagTickets = ticketsData.filter(ticket =>
          ticket.tags.some(ticketTag => ticketTag.id === tag.id)
        );
        
        const lane = {
          id: tag.id.toString(),
          title: tag.name,
          color: funilColor,
          funnel: funilName || null,
          cards: tagTickets.map(ticket => ({
            id: ticket.id.toString(),
            title: ticket.contact.name,
            description: '',
            phone: formatPhoneNumberInline(ticket.contact.number),
            ticketId: `#${ticket.id}`,
            user: ticket.user?.name || '',
            tags: getNormalTagsInline(ticket),
            unread: ticket.unreadMessages || 0,
            ticketData: ticket
          }))
        };
        lanes.push(lane);
      });
      
             // Aplicar ordem das colunas preservada para evitar mudança de posição
       if (columnOrder.length > 0) {
         const reorderedLanes = [...lanes].sort((a, b) => {
           const indexA = columnOrder.indexOf(a.id);
           const indexB = columnOrder.indexOf(b.id);
           
           if (indexA === -1) return 1;
           if (indexB === -1) return -1;
           
           return indexA - indexB;
         });
         setColumns(reorderedLanes);
       } else {
         setColumns(lanes);
       }
      
    } catch (error) {
      console.error('❌ Erro ao processar tags:', error);
    }
  }, [selectedFunnel, funnels, funnelColors]);

  // Função para buscar tags do Kanban
  const fetchTags = useCallback(async () => {
    // BLOQUEAR durante drag para evitar sobrescrever ordem
    if (isDragging) {
      return;
    }
    
    try {
      if (initialLoadComplete) {
        setIsFilterLoading(true);
      }
      const response = await api.get("/tag/kanban/", {
        params: {
          funilId: selectedFunnel
        }
      });
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      
      // Buscar tickets e processar imediatamente
      const ticketsData = await fetchTicketsAndReturn();
      
      // Processar os dados e criar as colunas
      // Funções auxiliares inline
      const formatPhoneNumberInline = (phoneNumber) => {
        if (!phoneNumber) return '';
        let cleanNumber = phoneNumber.replace(/^\+?55/, '').replace(/\D/g, '');
        if (cleanNumber.length === 10 && ['6', '7', '8', '9'].includes(cleanNumber[2])) {
          cleanNumber = cleanNumber.slice(0, 2) + '9' + cleanNumber.slice(2);
        }
        if (cleanNumber.length === 11) {
          return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.charAt(2)} ${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
        }
        if (cleanNumber.length === 10) {
          return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
        }
        return phoneNumber;
      };
      
      const getNormalTagsInline = (ticket) => {
        let normalTags = [];
        if (ticket.contact && ticket.contact.tags) {
          const contactNormalTags = ticket.contact.tags.filter(tag => tag.kanban === 0);
          normalTags = [...normalTags, ...contactNormalTags];
        }
        if (ticket.tags) {
          const ticketNormalTags = ticket.tags.filter(tag => tag.kanban === 0);
          normalTags = [...normalTags, ...ticketNormalTags];
        }
        const uniqueTags = normalTags.filter((tag, index, self) => 
          index === self.findIndex(t => t.id === tag.id)
        );
        return uniqueTags;
      };
      
      const lanes = [];
      
      // Tickets sem tags (Em aberto) - usando dados frescos
      const filteredTickets = ticketsData.filter(ticket => ticket.tags.length === 0);
      
      const emptyLane = {
        id: "lane0",
        title: "Em aberto",
        color: '#6c757d',
        funnel: null,
        cards: filteredTickets.map(ticket => ({
          id: ticket.id.toString(),
          title: ticket.contact.name,
          description: '',
          phone: formatPhoneNumberInline(ticket.contact.number),
          ticketId: `#${ticket.id}`,
          user: ticket.user?.name || '',
          tags: getNormalTagsInline(ticket),
          unread: ticket.unreadMessages || 0,
          ticketData: ticket
        }))
      };
      
      lanes.push(emptyLane);
      
      // Processar tags com tickets reais
      fetchedTags.forEach((tag) => {
        const funilIndex = funnels.findIndex(f => f.id === tag.funilId);
        const funilName = funnels[funilIndex]?.name;
        const funilColor = funilIndex >= 0 ? funnelColors[funilIndex % funnelColors.length] : '#e0e0e0';
        
        // Tickets com esta tag
        const tagTickets = ticketsData.filter(ticket =>
          ticket.tags.some(ticketTag => ticketTag.id === tag.id)
        );
        
        const lane = {
          id: tag.id.toString(),
          title: tag.name,
          color: funilColor,
          funnel: funilName || null,
          cards: tagTickets.map(ticket => ({
            id: ticket.id.toString(),
            title: ticket.contact.name,
            description: '',
            phone: formatPhoneNumberInline(ticket.contact.number),
            ticketId: `#${ticket.id}`,
            user: ticket.user?.name || '',
            tags: getNormalTagsInline(ticket),
            unread: ticket.unreadMessages || 0,
            ticketData: ticket
          }))
        };
        
        lanes.push(lane);
      });
      
      const processedData = { lanes };
      
      // As colunas serão processadas inicialmente sem ordem específica
      let newColumns = processedData.lanes;
      
      setColumns(newColumns);
      
      // Carregar preferências do usuário após definir as colunas
      if (user && newColumns.length > 0) {
        
        // Carregar colunas colapsadas
        if (user.hasOwnProperty('kanbanCollapsedColumns') && user.kanbanCollapsedColumns) {
          setCollapsedColumns(new Set(user.kanbanCollapsedColumns));
        }
        
        // Prioridade: 1) columnOrder atual 2) user.kanbanColumnOrder 3) ordem padrão
        let finalOrder = null;
        
        if (columnOrder.length > 0) {
          finalOrder = columnOrder;
        } else if (user.hasOwnProperty('kanbanColumnOrder') && user.kanbanColumnOrder?.length > 0) {
          finalOrder = user.kanbanColumnOrder;
        }
        
        if (finalOrder) {
          // Aplicar ordem das colunas
          const reorderedColumns = [...newColumns].sort((a, b) => {
            const indexA = finalOrder.indexOf(a.id);
            const indexB = finalOrder.indexOf(b.id);
            
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            
            return indexA - indexB;
          });
          
          setColumns(reorderedColumns);
          setColumnOrder(finalOrder);
        } else {
          // Inicializar ordem se não existir
          const currentOrder = newColumns.map(col => col.id);
          setColumnOrder(currentOrder);
        }
      }
      
    } catch (error) {
      console.error("Erro ao buscar tags:", error);
      toast.error("Erro ao carregar dados do Kanban");
    } finally {
      
      if (initialLoadComplete) {
        // Pequeno delay para mostrar que algo aconteceu
        setTimeout(() => {
          setIsFilterLoading(false);
        }, 200);
      }
    }
  }, [isDragging, selectedFunnel, initialLoadComplete, user]);



  // Função para criar card a partir de ticket real (otimizada)
  const createCardFromTicket = useCallback((ticket) => {
    return {
      id: ticket.id.toString(),
      title: ticket.contact.name,
      description: '', // Será preenchido pelo componente
      phone: formatPhoneNumber(ticket.contact.number),
      ticketId: `#${ticket.id}`,
      user: ticket.user?.name || '',
      tags: getNormalTags(ticket),
      unread: ticket.unreadMessages || 0,
      ticketData: ticket // Dados completos do ticket
    };
  }, []);

  // Função para formatar telefone brasileiro no padrão (98 9 98136-4572
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove o código do país (55) se existir
  let cleanNumber = phoneNumber.replace(/^\+?55/, '');
  
  // Remove caracteres não numéricos
  cleanNumber = cleanNumber.replace(/\D/g, '');
  
  // Adiciona o 9 na frente se for celular e não tiver
  if (cleanNumber.length === 10 && ['6', '7', '8', '9'].includes(cleanNumber[2])) {
    cleanNumber = cleanNumber.slice(0, 2) + '9' + cleanNumber.slice(2);
  }
  
  // Formata no padrão brasileiro (98 9 98136-4572
  if (cleanNumber.length === 11) {
    return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.charAt(2)} ${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
  }
  
  // Para números fixos de 10 dígitos: (98 3123-4567
  if (cleanNumber.length === 10) {
    return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
  }
  
  // Se não conseguir formatar, retorna o número original
  return phoneNumber;
};

  // Função para obter tags normais (não kanban) do ticket (otimizada)
  const getNormalTags = useCallback((ticket) => {
    let normalTags = [];
    
    if (ticket.contact && ticket.contact.tags) {
      const contactNormalTags = ticket.contact.tags.filter(tag => tag.kanban === 0);
      normalTags = [...normalTags, ...contactNormalTags];
    }
    
    if (ticket.tags) {
      const ticketNormalTags = ticket.tags.filter(tag => tag.kanban === 0);
      normalTags = [...normalTags, ...ticketNormalTags];
    }
    
    // Remove duplicatas
    const uniqueTags = normalTags.filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    );
    
    return uniqueTags;
  }, []);



  // Handlers dos filtros
  const handleFunnelChange = (event) => {
    setSelectedFunnel(event.target.value === "" ? null : event.target.value);
  };

  const handleAddConnectionClick = () => {
    history.push("/tagsKanban");
  };

  // Função para atualizar contador de mensagens não lidas em tempo real
  const updateCardUnreadCount = useCallback((ticketId, newCount) => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          parseInt(card.id) === ticketId 
            ? { ...card, unread: newCount }
            : card
        )
      }))
    );
  }, []);

  // Handler para abrir modal de mensagem
  const handleOpenMessageModal = async (ticket) => {
    setSelectedTicket(ticket);
    setMessageModalOpen(true);
    await fetchMessages(ticket.id);
    
    // Zerar badge de mensagens não lidas em tempo real
    updateCardUnreadCount(ticket.id, 0);
  };

  // Handler para fechar modal de mensagem
  const handleCloseMessageModal = () => {
    // Zerar badge quando fechar modal (usuário viu as mensagens)
    if (selectedTicket) {
      updateCardUnreadCount(selectedTicket.id, 0);
    }
    
    setMessageModalOpen(false);
    setSelectedTicket(null);
    setMessageText("");
    setMessages([]);
    setShowEmoji(false);
    setRecording(false);
    setPrivateMessage(false);
    setAnchorEl(null);
    setSenVcardModalOpen(false);
    setModalCameraOpen(false);
    setAppointmentModalOpen(false);
    setMediasUpload([]);
    setShowModalMedias(false);
  };

  // Função para fechar modal de mídias (EXATAMENTE como MessageInput)
  const handleCloseModalMedias = () => {
    setShowModalMedias(false);
  };

  // Função para cancelar seleção (EXATAMENTE como MessageInput)
  const handleCancelSelection = () => {
    setMediasUpload([]);
    setShowModalMedias(false);
  };

  // Função para fazer scroll para o fim das mensagens
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Função para buscar mensagens do ticket
  const fetchMessages = async (ticketId, showLoading = true) => {
    if (!ticketId) return;
    
    if (showLoading) {
      setLoadingMessages(true);
    }
    
    try {
      const response = await api.get(`/messages/${ticketId}`);
      setMessages(response.data.messages || []);
      
      // Só rola se for carregamento inicial
      if (showLoading) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      if (showLoading) {
        toast.error("Erro ao carregar mensagens");
      }
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  // Handler para enviar mensagem simples
  const handleSendSimpleMessage = async () => {
    if (!messageText.trim() || !selectedTicket) return;

    try {
      const userName = privateMessage ? `${user.name} - Mensagem Privada` : user.name;
      
      const messageData = {
        read: 1,
        fromMe: true,
        mediaUrl: "",
        body: (signMessage || privateMessage) ? `*${userName}:*\n${messageText.trim()}` : messageText.trim(),
        quotedMsg: null,
        isPrivate: privateMessage ? "true" : "false"
      };

      // Adiciona a mensagem instantaneamente ao estado local
      const newMessage = {
        id: Date.now(), // ID temporário
        body: messageData.body,
        fromMe: true,
        isPrivate: privateMessage,
        createdAt: new Date().toISOString(),
        ticket: selectedTicket,
        contact: selectedTicket.contact
      };
      
      // Mensagem será adicionada pelo WebSocket automaticamente
      setTimeout(scrollToBottom, 100);

      // Limpa o input
      setMessageText("");
      setPrivateMessage(false);
      
      // Envia para o servidor
      await api.post(`/messages/${selectedTicket.id}`, messageData);
      // Toast removido - sem necessidade de notificação no Kanban
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  // Função para adicionar emoji
  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setMessageText((prevState) => prevState + emoji);
  };

  // Função para abrir menu de anexos
  const handleOpenMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Função para fechar menu
  const handleMenuItemClick = () => {
    setAnchorEl(null);
  };

  // Função para lidar com fotos e vídeos
  const handleChangePhotosVideos = (e) => {
    if (!e.target.files) return;
    const selectedMedias = Array.from(e.target.files).map(file => sanitizeFileForUpload(file));
    setMediasUpload(selectedMedias);
    setShowModalMedias(true);
    handleMenuItemClick();
  };

  // Função para lidar com documentos
  const handleChangeDocuments = (e) => {
    if (!e.target.files) return;
    const selectedMedias = Array.from(e.target.files).map(file => sanitizeFileForUpload(file));
    setMediasUpload(selectedMedias);
    setShowModalMedias(true);
    handleMenuItemClick();
  };

  // Função para upload de mídia (EXATAMENTE como MessageInput)
  const handleUploadMedia = async (mediasUpload) => {
    if (!selectedTicket) return;
    
    setLoadingMessages(true);
    const userName = privateMessage
      ? `${user.name} - Mensagem Privada`
      : user.name;

    // Certifique-se de que a variável medias esteja preenchida antes de continuar
    if (!mediasUpload.length) {
      console.log("Nenhuma mídia selecionada.");
      setLoadingMessages(false);
      return;
    }

    const formData = new FormData();
    formData.append("fromMe", true);
    formData.append("isPrivate", privateMessage ? "true" : "false");
    mediasUpload.forEach((media) => {
      formData.append("body", (signMessage || privateMessage) ? `*${userName}:*\n${media.caption}` : media.caption);
      formData.append("medias", media.file);
    });

    try {
      await api.post(`/messages/${selectedTicket.id}`, formData);
    } catch (err) {
      console.log(err);
    }

    setLoadingMessages(false);
    setMediasUpload([]);
    setShowModalMedias(false);
    setPrivateMessage(false);
    setTimeout(scrollToBottom, 100);
  };

  // Função para iniciar gravação de áudio (EXATAMENTE como no MessageInput)
  const handleStartRecording = async () => {
    setLoadingAudio(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoadingAudio(false);
      
      // Inicia o contador de tempo
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("❌ Erro ao iniciar gravação:", err);
      toast.error("Erro ao acessar microfone");
      setLoadingAudio(false);
    }
  };

  // Função para parar e enviar áudio (EXATAMENTE como no MessageInput)
  const handleUploadAudio = async () => {
    // Para o contador de tempo
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    setLoadingAudio(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoadingAudio(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio_${new Date().getTime()}.mp3`;
      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      if (isMounted.current) {
        await api.post(`/messages/${selectedTicket.id}`, formData);
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        toast.error("Limite de 50 chamados atingido. Para enviar novas mensagens, entre em contato com o suporte.");
      } else {
        toast.error("Erro ao enviar áudio");
      }
    } finally {
      if (isMounted.current) {
        setLoadingAudio(false);
        setRecording(false);
        setRecordingTime(0);
      }
    }
  };

  // Função para cancelar gravação
  const handleCancelAudio = async () => {
    try {
      // Para o contador de tempo
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
      setRecordingTime(0);
    } catch (err) {
      console.error("Erro ao cancelar gravação:", err);
      setRecording(false);
      setRecordingTime(0);
    }
  };

  // Função para alternar mensagem privada
  const handlePrivateMessage = () => {
    setPrivateMessage(!privateMessage);
  };

  // Função para alternar assinatura
  const handleChangeSign = () => {
    setSignMessage(!signMessage);
  };

  // Função para abrir modal de contato
  const handleSendContactModalOpen = () => {
    handleMenuItemClick();
    setSenVcardModalOpen(true);
  };

  // Função para abrir modal de câmera
  const handleCameraModalOpen = () => {
    handleMenuItemClick();
    setModalCameraOpen(true);
  };

  // Função para capturar imagem da câmera
  const handleCapture = async (imageData) => {
    if (!imageData || !selectedTicket) return;
    
    setLoadingMessages(true);
    try {
      const formData = new FormData();
      const filename = `camera_${new Date().getTime()}.png`;
      formData.append("medias", imageData, filename);
      formData.append("body", privateMessage ? `\u200d` : "");
      formData.append("fromMe", true);

      await api.post(`/messages/${selectedTicket.id}`, formData);
      toast.success("Foto enviada com sucesso!");
      
      // Recarrega mensagens
      await fetchMessages(selectedTicket.id);
      setTimeout(scrollToBottom, 200);
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      toast.error("Erro ao enviar foto");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Função para enviar contato
  const handleSendContatcMessage = async (vcard) => {
    setSenVcardModalOpen(false);
    if (!vcard || !selectedTicket) return;
    
    setLoadingMessages(true);

    try {
      const message = {
        read: 1,
        fromMe: true,
        mediaUrl: "",
        body: null,
        quotedMsg: null,
        isPrivate: privateMessage ? "true" : "false",
        vCard: vcard,
      };
      
      await api.post(`/messages/${selectedTicket.id}`, message);
      toast.success("Contato enviado com sucesso!");
      setPrivateMessage(false);
      
      // Recarrega mensagens
      await fetchMessages(selectedTicket.id);
      setTimeout(scrollToBottom, 200);
    } catch (err) {
      console.error("Erro ao enviar contato:", err);
      toast.error("Erro ao enviar contato");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handler para mover cards entre colunas (APENAS backend - estado local já foi atualizado)
  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      // ✅ Remove todas as tags do ticket primeiro
      await api.delete(`/ticket-tags/${cardId}`);
      
      // Adiciona nova tag se não for coluna "Em aberto" (lane0)
      if (targetLaneId !== 'lane0' && targetLaneId !== 'em-aberto') {
        await api.put(`/ticket-tags/${cardId}/${targetLaneId}`);
      }
      
      // ❌ NÃO recarrega dados para não sobrescrever o estado local
      // await fetchTags();
    } catch (err) {
      console.error('Erro ao mover ticket:', err);
      toast.error('Erro ao mover ticket');
      // Em caso de erro, recarrega dados para reverter mudanças
      await fetchTags();
    }
  };

  // Função para alternar colapso das colunas
  const toggleColumnCollapse = (columnId) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      
      // Salvar preferências imediatamente
      saveColumnPreferencesWithState(newSet);
      
      return newSet;
    });
  };

  // Funções para drag horizontal do container
  const handleContainerMouseDown = (e) => {
    // Só ativar se clicar no fundo, não em elementos filhos
    if (e.target.classList.contains('kanban-container')) {
      setIsDraggingContainer(true);
      setLastX(e.clientX);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Previne seleção de texto
      e.preventDefault();
    }
  };

  const handleContainerMouseMove = (e) => {
    if (!isDraggingContainer || !kanbanContainerRef.current) return;
    
    const deltaX = lastX - e.clientX;
    kanbanContainerRef.current.scrollLeft += deltaX;
    setLastX(e.clientX);
    e.preventDefault();
  };

  const handleContainerMouseUp = () => {
    setIsDraggingContainer(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // Effect para gerenciar eventos globais de mouse
  useEffect(() => {
    if (isDraggingContainer) {
      document.addEventListener('mousemove', handleContainerMouseMove);
      document.addEventListener('mouseup', handleContainerMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleContainerMouseMove);
        document.removeEventListener('mouseup', handleContainerMouseUp);
      };
    }
  }, [isDraggingContainer, lastX]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Efeito para carregar tags selecionadas quando allTags for carregado
  useEffect(() => {
    if (user && user.kanbanSelectedTags && user.kanbanSelectedTags.length > 0 && allTags.length > 0 && selectedTags.length === 0) {
      const savedTags = allTags.filter(tag => 
        user.kanbanSelectedTags.includes(tag.id)
      );
      setSelectedTags(savedTags);
    }
  }, [allTags, user]);

  // Efeito para carregar usuários selecionados quando allUsers for carregado
  useEffect(() => {
    if (user && user.profile === 'admin' && user.kanbanSelectedUsers && user.kanbanSelectedUsers.length > 0 && allUsers.length > 0 && selectedUsers.length === 0) {
      const savedUsers = allUsers.filter(u => 
        user.kanbanSelectedUsers.includes(u.id)
      );
      setSelectedUsers(savedUsers);
    }
  }, [allUsers, user]);

  // Efeito para resetar o carrossel de avatares quando os usuários mudarem
  useEffect(() => {
    setAvatarStartIndex(0);
  }, [allUsers]);

  // Efeito para carregar funil selecionado quando user e funnels estiverem disponíveis
  useEffect(() => {
    if (user && user.hasOwnProperty('kanbanSelectedFunnel') && funnels.length > 0) {
      // Se o usuário tem um funil salvo, definir como selecionado
      if (user.kanbanSelectedFunnel) {
        // Verificar se o funil ainda existe na lista
        const funnelExists = funnels.find(f => f.id === user.kanbanSelectedFunnel);
        if (funnelExists) {
          setSelectedFunnel(user.kanbanSelectedFunnel);
        } else {
          // Se o funil não existe mais, resetar para null (Todos os Funis)
          setSelectedFunnel(null);
        }
      } else {
        // Se kanbanSelectedFunnel é null, manter como "Todos os Funis"
        setSelectedFunnel(null);
      }
    }
  }, [user, funnels]);

    // Efeito OTIMIZADO para atualizar dados quando filtros mudarem
  useEffect(() => {
    // Evita execução desnecessária logo após filtro instantâneo
    if (lastInstantFilter && (Date.now() - lastInstantFilter) < 2000) {
      return;
    }
    
    if (user && initialLoadComplete && funnels.length > 0) {
      fetchTags();
    }
  }, [selectedFunnel, selectedTags, selectedUsers, startDate, endDate, user, initialLoadComplete, funnels.length, lastInstantFilter]);

  // Efeito separado para salvar filtros (evita loops infinitos)
  useEffect(() => {
    if (user && initialLoadComplete) {
      // Salva sempre que houver mudança, incluindo quando selectedFunnel for null (Todos os Funis)
      const timeoutId = setTimeout(() => {
        saveKanbanFilters(selectedFunnel, selectedTags, selectedUsers);
      }, 2000); // Delay maior para evitar muitas chamadas
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedFunnel, selectedTags, selectedUsers, initialLoadComplete]);

  // Effect para carregar tags após inicialização completa (EVITA DUPLICAÇÃO)
  useEffect(() => {
    if (initialLoadComplete && funnels.length > 0 && columns.length === 0) {
      fetchTags();
    }
  }, [initialLoadComplete, funnels.length]);

  // Handlers para mudança de datas
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  // Atualização periódica das mensagens para status de ack
  useEffect(() => {
    if (!selectedTicket || !messageModalOpen) return;

    const interval = setInterval(() => {
      // Busca mensagens atualizadas sem loading (para não interferir na UI)
      fetchMessages(selectedTicket.id, false);
    }, 3000); // Atualiza a cada 3 segundos

    return () => clearInterval(interval);
  }, [selectedTicket, messageModalOpen]);

  // WebSocket para tempo real de mensagens
  useEffect(() => {
    if (!selectedTicket || !socket) return;

    const ticketId = selectedTicket.id;

    // Entra na sala do ticket
    socket.emit("joinChatBox", ticketId);

    // Listener para novas mensagens
    const handleNewMessage = (data) => {
      
      // Verifica se a mensagem é do ticket atual (testando uuid e id)
      const isCurrentTicket = data.ticket?.uuid === ticketId || 
                             data.ticket?.id === ticketId ||
                             data.ticket?.id === parseInt(ticketId);
      
      if (data.action === "create" && isCurrentTicket) {
        // Adiciona a mensagem ao estado local
        setMessages(prev => {
          // Verifica se a mensagem já existe (evita duplicatas)
          const exists = prev.find(msg => msg.id === data.message.id);
          if (exists) {
            return prev;
          }
          
          return [...prev, data.message];
        });
        
        // Scroll para baixo
        setTimeout(scrollToBottom, 100);
      }
      
      if (data.action === "update" && isCurrentTicket) {
        // Atualiza mensagem existente (incluindo status de ack)
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.message.id ? { ...msg, ...data.message } : msg
          )
        );
      }
    };

    // Registra o listener
    socket.on(`company-${user.companyId}-appMessage`, handleNewMessage);

    // Cleanup ao desmontar ou trocar ticket
    return () => {
      socket.emit("joinChatBoxLeave", ticketId);
      socket.off(`company-${user.companyId}-appMessage`, handleNewMessage);
    };
  }, [selectedTicket, socket, user.companyId]);

  // WebSocket para atualizar mensagens não lidas em tempo real no Kanban
  useEffect(() => {
    if (!socket || !user) return;

    const handleTicketUpdate = (data) => {
      if (data.action === "update" && data.ticket) {
        // Atualizar contadores de mensagens não lidas nos cards
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.ticketId === `#${data.ticket.id}` 
                ? { ...card, unread: data.ticket.unreadMessages || 0 }
                : card
            )
          }))
        );
      }
    };

    const handleNewMessage = (data) => {
      if (data.action === "create" && data.ticket && !data.fromMe) {
        // Incrementar contador de mensagens não lidas
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.ticketId === `#${data.ticket.id}` 
                ? { ...card, unread: (card.unread || 0) + 1 }
                : card
            )
          }))
        );
      }
    };

    // Registrar listeners
    socket.on(`company-${user.companyId}-ticket`, handleTicketUpdate);
    socket.on(`company-${user.companyId}-appMessage`, handleNewMessage);

    // Cleanup
    return () => {
      socket.off(`company-${user.companyId}-ticket`, handleTicketUpdate);
      socket.off(`company-${user.companyId}-appMessage`, handleNewMessage);
    };
  }, [socket, user, setColumns]);

  // Cleanup quando componente é desmontado
  useEffect(() => {
    return () => {
      // Limpa o intervalo de gravação se existir
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    };
  }, []);

  // Configuração dos sensores
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Funções auxiliares
  const findCardById = (cardId) => {
    for (const column of columns) {
      const card = column.cards.find(card => card.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const findColumnById = (columnId) => {
    return columns.find(column => column.id === columnId);
  };

  const findColumnByCardId = (cardId) => {
    return columns.find(column => 
      column.cards.some(card => card.id === cardId)
    );
  };

  // Handlers do drag and drop
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setDraggedItem(active);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Processar drag de cards e colunas
    if (activeType === 'card') {
      // Mover cards
      const cardId = active.id;
      let targetColumnId = over.id;

      // Se dropou sobre um card, pegar a coluna do card
      if (overType === 'card') {
        const targetColumn = findColumnByCardId(over.id);
        if (targetColumn) {
          targetColumnId = targetColumn.id;
        }
      }

      // Se dropou sobre uma área droppable, extrair o ID da coluna
      if (targetColumnId.startsWith('droppable-')) {
        targetColumnId = targetColumnId.replace('droppable-', '');
      }

      // Encontrar coluna de origem
      const sourceColumn = findColumnByCardId(cardId);
      if (!sourceColumn) return;

      // Só mover se for para coluna diferente
      if (sourceColumn.id !== targetColumnId) {
        // ✅ PRIMEIRO: Atualizar estado local para UX imediata
        const newColumns = columns.map(col => ({
          ...col,
          cards: col.cards ? [...col.cards] : []
        }));
        
        // Encontrar card e colunas
        const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn.id);
        const targetColIndex = newColumns.findIndex(col => col.id === targetColumnId);
        const cardIndex = newColumns[sourceColIndex].cards.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1 && sourceColIndex !== -1 && targetColIndex !== -1) {
          // Mover o card
          const [movedCard] = newColumns[sourceColIndex].cards.splice(cardIndex, 1);
          newColumns[targetColIndex].cards.push(movedCard);
          
          // Atualizar estado local IMEDIATAMENTE
          setColumns(newColumns);
          
          // ✅ DEPOIS: Atualizar no backend (sem aguardar)
          handleCardMove(cardId, sourceColumn.id, targetColumnId);
        }
      }
    } else if (activeType === 'column') {
      // Mover colunas
      const activeColumnIndex = columns.findIndex(col => col.id === active.id);
      const overColumnIndex = columns.findIndex(col => col.id === over.id);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex !== overColumnIndex) {
        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(activeColumnIndex, 1);
        newColumns.splice(overColumnIndex, 0, movedColumn);
        
        setColumns(newColumns);
        
        // Salvar nova ordem das colunas
        const newOrder = newColumns.map(col => col.id);
        setColumnOrder(newOrder);
        
        // Salvar no banco com a NOVA ORDEM (não o estado antigo)
        const saveData = {
          kanbanCollapsedColumns: Array.from(collapsedColumns),
          kanbanColumnOrder: newOrder  // ← USAR A NOVA ORDEM, NÃO O ESTADO
        };
        
        api.put(`/users/${user.id}/kanban-filters`, saveData).catch(error => {
          console.error('Erro ao salvar ordem:', error);
        });
      }
    }

    setActiveId(null);
    setDraggedItem(null);
    
    // Liberar drag após um delay para evitar fetchTags imediato
    setTimeout(() => {
      setIsDragging(false);
    }, 500);
  };

  return (
    <>
    <MainContainer>
      <Paper className={classes.mainContainer}>
        {/* Header modernizado */}
        <div className={classes.header}>
          <div className={classes.headerCenter}>
          <TextField
              label="Data de Início"
            type="date"
            value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            variant="outlined"
            size="small"
              className={classes.dateField}
          />
          <TextField
              label="Data de Fim"
            type="date"
            value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            variant="outlined"
            size="small"
              className={classes.dateField}
          />
            
          <FormControl 
            variant="outlined" 
            size="small" 
              className={classes.filterField}
              style={{ 
                minWidth: 220, // Aumentado de 200 para 220
                width: 'auto', // Largura automática baseada no conteúdo
                maxWidth: 300  // Máximo para não crescer demais
              }}
          >
            <InputLabel>Filtrar por Funil</InputLabel>
            <Select
                value={selectedFunnel === null ? "" : selectedFunnel}
              onChange={handleFunnelChange}
              label="Filtrar por Funil"
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left"
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left"
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    backgroundColor: "#ffffff",
                    marginTop: "4px",
                  }
                }
              }}
            >
              <MenuItem value="">Todos os Funis</MenuItem>
              {funnels.map(funnel => (
                <MenuItem key={funnel.id} value={funnel.id}>{funnel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Filtro de Tags */}
          <FormControl 
            variant="outlined" 
            size="small" 
              className={classes.filterField}
              style={{ 
                minWidth: 200, // Aumentado de 180 para 200
                width: 'auto', // Largura automática baseada no conteúdo
                maxWidth: 280  // Máximo para não crescer demais
              }}
          >
            <InputLabel>Filtrar por Tags</InputLabel>
            <Select
              multiple
              value={selectedTags.map(tag => tag.id)}
              onChange={(event) => {
                const selectedIds = event.target.value;
                const selectedTagsArray = allTags.filter(tag => selectedIds.includes(tag.id));
                setSelectedTags(selectedTagsArray);
                
                // ⚡ FILTRO INSTANTÂNEO DE TAGS
                setLastInstantFilter(Date.now());
                filterTicketsInstantlyWithTags(selectedTagsArray);
              }}
              label="Filtrar por Tags"
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return 'Selecionar tags';
                } else if (selected.length === 1) {
                  const tag = allTags.find(t => t.id === selected[0]);
                  return tag?.name || 'Tag selecionada';
                } else {
                  return `${selected.length} tags selecionadas`;
                }
              }}
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left"
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left"
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    backgroundColor: "#ffffff",
                    marginTop: "4px",
                    maxHeight: "200px"
                  }
                }
              }}
            >
              {allTags.map(tag => (
                <MenuItem key={tag.id} value={tag.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tag.color || "#eee"
                      }}
                    />
                    {tag.name}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filtro de Usuários por Avatares - apenas para admin */}
          {user?.profile === 'admin' && allUsers.length > 0 && (
            <div className={classes.userAvatarFilter}>
              {/* Avatar de Selecionar/Deselecionar Todos */}
              <Tooltip 
                title={selectedUsers.length === allUsers.length ? "Deselecionar Todos" : "Selecionar Todos"} 
                placement="top"
              >
                <div
                  onClick={handleSelectAllUsers}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Avatar
                    className={`${classes.selectAllAvatar} ${
                      selectedUsers.length === allUsers.length ? classes.selectAllAvatarActive : ''
                    }`}
                  >
                    {selectedUsers.length === allUsers.length ? '✓' : '∀'}
                  </Avatar>
                </div>
              </Tooltip>

              {shouldShowNavigation && (
                <div className={classes.avatarCarousel}>
                  {/* Seta para voltar */}
                  <button
                    className={classes.avatarNavButton}
                    onClick={handlePreviousAvatars}
                    disabled={!canNavigatePrevious}
                    title="Usuários anteriores"
                  >
                    <KeyboardArrowLeft />
                  </button>
                  
                  {/* Container dos avatares visíveis */}
                  <div 
                    className={classes.avatarContainer}
                    onWheel={handleAvatarScroll}
                  >
                    {allUsers
                      .slice(avatarStartIndex, avatarStartIndex + maxVisibleAvatars)
                      .map(userItem => {
                        const isSelected = selectedUsers.some(su => su.id === userItem.id);
                        
                        // Avatar URL (mesma lógica da página Users)
                        const avatarUrl = userItem.id === user.id
                          ? `${backendUrl}/public/company${userItem.companyId}/user/${user.profileImage || 'nopicture.png'}`
                          : userItem.profileImage
                            ? `${backendUrl}/public/company${userItem.companyId}/user/${userItem.profileImage}`
                            : undefined;
                        
                        return (
                          <Tooltip key={userItem.id} title={userItem.name} placement="top">
                            <div
                              onClick={() => {
                                let newSelection;
                                if (isSelected) {
                                  // Remove usuário da seleção
                                  newSelection = selectedUsers.filter(su => su.id !== userItem.id);
                                } else {
                                  // Adiciona usuário à seleção
                                  newSelection = [...selectedUsers, userItem];
                                }
                                
                                // Atualiza o estado
                                setSelectedUsers(newSelection);
                                
                                // 💾 SALVA FILTROS IMEDIATAMENTE - Para persistir no usuário logado
                                if (user && initialLoadComplete) {
                                  saveKanbanFilters(selectedFunnel, selectedTags, newSelection);
                                }
                                
                                // ⚡ FILTRO INSTANTÂNEO - Executa imediatamente com a nova seleção
                                setLastInstantFilter(Date.now());
                                filterTicketsInstantly(newSelection);
                              }}
                              style={{
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                filter: isSelected ? 'none' : 'grayscale(0.3)',
                                opacity: isSelected ? 1 : 0.7,
                              }}
                            >
                              <Avatar
                                src={avatarUrl}
                                className={classes.userAvatar}
                                style={{
                                  border: isSelected ? '2px solid #00C307' : '2px solid transparent',
                                  boxShadow: isSelected ? '0 2px 8px rgba(0, 195, 7, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                                  backgroundColor: isSelected ? '#00C307' : '#f5f5f5',
                                  color: isSelected ? '#fff' : '#666',
                                }}
                              >
                                {userItem.name.charAt(0).toUpperCase()}
                              </Avatar>
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-2px',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: '#00C307',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '8px',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  border: '1px solid white',
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                          </Tooltip>
                        );
                      })}
                  </div>
                  
                  {/* Seta para avançar */}
                  <button
                    className={classes.avatarNavButton}
                    onClick={handleNextAvatars}
                    disabled={!canNavigateNext}
                    title="Próximos usuários"
                  >
                    <KeyboardArrowRight />
                  </button>
                </div>
              )}
              
              {/* Exibição normal quando há 4 ou menos usuários */}
              {!shouldShowNavigation && allUsers.map(userItem => {
                const isSelected = selectedUsers.some(su => su.id === userItem.id);
                
                // Avatar URL (mesma lógica da página Users)
                const avatarUrl = userItem.id === user.id
                  ? `${backendUrl}/public/company${userItem.companyId}/user/${user.profileImage || 'nopicture.png'}`
                  : userItem.profileImage
                    ? `${backendUrl}/public/company${userItem.companyId}/user/${userItem.profileImage}`
                    : undefined;
                
                return (
                  <Tooltip key={userItem.id} title={userItem.name} placement="top">
                    <div
                      onClick={() => {
                        let newSelection;
                        if (isSelected) {
                          // Remove usuário da seleção
                          newSelection = selectedUsers.filter(su => su.id !== userItem.id);
                        } else {
                          // Adiciona usuário à seleção
                          newSelection = [...selectedUsers, userItem];
                        }
                        
                        // Atualiza o estado
                        setSelectedUsers(newSelection);
                        
                        // 💾 SALVA FILTROS IMEDIATAMENTE - Para persistir no usuário logado
                        if (user && initialLoadComplete) {
                          saveKanbanFilters(selectedFunnel, selectedTags, newSelection);
                        }
                        
                        // ⚡ FILTRO INSTANTÂNEO - Executa imediatamente com a nova seleção
                        setLastInstantFilter(Date.now());
                        filterTicketsInstantly(newSelection);
                      }}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        filter: isSelected ? 'none' : 'grayscale(0.3)',
                        opacity: isSelected ? 1 : 0.7,
                      }}
                    >
                      <Avatar
                        src={avatarUrl}
                        className={classes.userAvatar}
                        style={{
                          border: isSelected ? '2px solid #00C307' : '2px solid transparent',
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 195, 7, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                          backgroundColor: isSelected ? '#00C307' : '#f5f5f5',
                          color: isSelected ? '#fff' : '#666',
                        }}
                      >
                        {userItem.name.charAt(0).toUpperCase()}
                      </Avatar>
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#00C307',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '1px solid white',
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
          
          <div className={classes.headerRight}>
        <Can role={user?.profile} perform="dashboard:view" yes={() => (
          <Button
            variant="contained"
            className={classes.addButton}
            onClick={handleAddConnectionClick}
            startIcon={<Add />}
                size="small"
          >
                GERENCIAR FUNIS
          </Button>
        )} />
      </div>
        </div>

        {/* Wrapper do Kanban */}
        <div className={classes.kanbanWrapper}>
          <div className={classes.boardContainer}>
            {/* Indicador de loading */}
            {(isFilterLoading || loading) && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
                backgroundColor: 'rgba(0, 195, 7, 0.1)',
              padding: '6px 10px',
              borderRadius: '20px',
                border: '1px solid rgba(0, 195, 7, 0.2)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                  border: '2px solid rgba(0, 195, 7, 0.3)',
                  borderTop: '2px solid #00C307',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <Typography style={{
                  color: '#00C307',
                fontSize: '11px',
                fontWeight: 500
              }}>
                  
              </Typography>
            </div>
          )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div 
                className="kanban-container"
                ref={kanbanContainerRef}
                onMouseDown={handleContainerMouseDown}
                onMouseMove={handleContainerMouseMove}
                onMouseUp={handleContainerMouseUp}
                onMouseLeave={handleContainerMouseUp}
                style={{ cursor: isDraggingContainer ? 'grabbing' : 'grab' }}
              >
                {/* Colunas do Kanban - Drag das colunas temporariamente desabilitado */}
                {columns.map((column) => (
                  <KanbanColumn 
                    key={column.id} 
                    column={column}
                    isCollapsed={collapsedColumns.has(column.id)}
                    onToggleCollapse={toggleColumnCollapse}
                  >
                    <SortableContext
                      items={column.cards?.filter(card => card?.id).map(card => card.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {column.cards?.filter(card => card?.id).map((card) => (
                        <KanbanCard key={card.id} card={card} onSendMessage={handleOpenMessageModal} />
                      )) || []}
                    </SortableContext>
                  </KanbanColumn>
                ))}
                
                {/* Mensagem quando não há dados */}
                {columns.length === 0 && !loading && !isFilterLoading && (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    width: '100%',
              display: 'flex',
              flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: '200px'
                  }}>
                    <Typography variant="h6" style={{ color: '#666', marginBottom: '8px' }}>
                      Nenhuma coluna encontrada
                    </Typography>
                    <Typography variant="body2" style={{ color: '#999' }}>
                      Ajuste os filtros ou crie novas colunas no gerenciador de funis
                    </Typography>
                  </div>
                )}
              </div>
            
              {/* Drag Overlay */}
              <DragOverlay>
                {activeId ? (
                  <div className="drag-overlay">
                    {draggedItem?.data.current?.type === 'card' ? (
                      (() => {
                        const card = findCardById(activeId);
                        return card ? <KanbanCard card={card} onSendMessage={handleOpenMessageModal} /> : null;
                      })()
                    ) : draggedItem?.data.current?.type === 'column' ? (
                      (() => {
                        const column = findColumnById(activeId);
                        return column ? (
                          <KanbanColumn column={column}>
                            {column.cards.map(card => (
                              <KanbanCard key={card.id} card={card} />
                            ))}
                          </KanbanColumn>
                        ) : null;
                      })()
                    ) : null}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </Paper>

      {/* Modal de Envio de Mensagem */}
      <Dialog
        open={messageModalOpen}
        onClose={handleCloseMessageModal}
        maxWidth="md"
        fullWidth
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        PaperProps={{
          style: {
            borderRadius: '12px',
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle style={{ 
          borderBottom: '1px solid #e0e0e0', 
          paddingBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {selectedTicket && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar 
                src={selectedTicket.contact?.urlPicture || undefined}
                style={{ width: '48px', height: '48px' }}
              >
                {selectedTicket.contact?.name?.charAt(0)}
              </Avatar>
              <div>
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {selectedTicket.contact?.name}
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <WhatsApp style={{ fontSize: '16px', color: '#25D366' }} />
                  <Typography variant="body2" color="textSecondary">
                    {formatPhoneNumber(selectedTicket.contact?.number)} • Ticket #{selectedTicket.id}
                  </Typography>
                </div>
              </div>
            </div>
          )}
        </DialogTitle>
        
        <DialogContent style={{ 
          padding: '16px',
          display: 'flex', 
          flexDirection: 'column', 
          height: '600px',
          overflow: 'hidden'
        }}>
          {selectedTicket && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Lista de Mensagens */}
              <div style={{ 
                flex: 1, 
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Typography variant="body2">Carregando mensagens...</Typography>
                  </div>
                                 ) : messages.length > 0 ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {messages.map((message, index) => {
                       // Verificar se é mensagem privada
                       const isPrivate = message.isPrivate === true || message.isPrivate === "true";
                       
                       // Verificar se tem assinatura (formato: *Nome:* mensagem)
                       const hasSignature = message.body && message.body.includes('*') && message.body.includes(':*');
                       let displayName = '';
                       let messageText = message.body || '';
                       
                       // Não mostrar nome de arquivo para imagens/vídeos
                       const isMedia = message.mediaType === 'image' || message.mediaType?.startsWith('image/') ||
                                      message.mediaType === 'video' || message.mediaType?.startsWith('video/');
                       
                       if (hasSignature) {
                         const signatureMatch = message.body.match(/\*([^:]+):\*\n?(.*)/s);
                         if (signatureMatch) {
                           displayName = signatureMatch[1];
                           messageText = signatureMatch[2];
                         }
                       }
                       
                       // Se é mídia (imagem/vídeo/documento/áudio) e o texto é só o nome do arquivo, não mostrar
                       const isDocument = message.mediaType === 'application' || message.mediaType?.startsWith('application/');
                       const isAudioMsg = message.mediaType === 'audio' || message.mediaType?.startsWith('audio/');
                       
                       // Para documentos, sempre limpa o texto - a assinatura será mostrada separadamente
                       if (isDocument && messageText) {
                         // Para documentos, remove todo o texto do body (incluindo nome do arquivo)
                         // A assinatura será extraída e mostrada separadamente
                         messageText = '';
                       }
                       // Para outros tipos de mídia
                       else if ((isMedia || isAudioMsg) && messageText) {
                         // Remove se for apenas nome de arquivo com timestamp ou texto padrão
                         if (/^\d+_.*\.\w+$/.test(messageText.trim()) || 
                             messageText.trim() === 'Audio' || 
                             messageText.trim() === 'Áudio' ||
                             /^\d+\.(mp3|wav|m4a|ogg)$/i.test(messageText.trim())) {
                           messageText = '';
                         }
                         // Se tem assinatura, extrai só a legenda (sem o nome do arquivo)
                         else if (hasSignature && messageText.includes('\n')) {
                           const parts = messageText.split('\n');
                           if (parts.length > 1 && (/^\d+_.*\.\w+$/.test(parts[parts.length - 1].trim()) || 
                               /^\d+\.(mp3|wav|m4a|ogg)$/i.test(parts[parts.length - 1].trim()))) {
                             // Remove a última linha se for nome de arquivo
                             messageText = parts.slice(0, -1).join('\n');
                           }
                         }
                       }
                       
                       // Renderizar mídia se existir
                       const renderMedia = () => {
                         if (message.mediaUrl) {
                           // Usar mediaType da mensagem ao invés de extensão
                           const isImage = message.mediaType === 'image' || message.mediaType?.startsWith('image/');
                           const isVideo = message.mediaType === 'video' || message.mediaType?.startsWith('video/');
                           const isAudio = message.mediaType === 'audio' || message.mediaType?.startsWith('audio/');
                           
                           // Detectar documentos por mediaType ou pela URL
                           const isDocumentByType = message.mediaType === 'application' || message.mediaType?.startsWith('application/');
                           const isDocumentByUrl = message.mediaUrl && (
                             message.mediaUrl.includes('.pdf') || 
                             message.mediaUrl.includes('.doc') || 
                             message.mediaUrl.includes('.txt') ||
                             message.mediaUrl.includes('.xls') ||
                             message.mediaUrl.includes('.zip') ||
                             message.mediaUrl.includes('.rar')
                           );
                           const isDocument = isDocumentByType || isDocumentByUrl;
                           
                           if (isImage) {
                             return (
                               <img 
                                 src={message.mediaUrl} 
                                 alt="Imagem"
                                 style={{ 
                                   maxWidth: '200px', 
                                   maxHeight: '200px', 
                                   borderRadius: '8px',
                                   marginBottom: messageText ? '8px' : '0'
                                 }}
                               />
                             );
                           } else if (isVideo) {
                             return (
                               <video 
                                 controls 
                  style={{
                                   maxWidth: '200px', 
                                   maxHeight: '200px', 
                                   borderRadius: '8px',
                                   marginBottom: messageText ? '8px' : '0'
                                 }}
                               >
                                 <source src={message.mediaUrl} />
                               </video>
                             );
                           } else if (isAudio) {
                             return (
                               <audio 
                                 controls 
                                 style={{ 
                                   width: '280px', // Aumentado de 200px para 280px
                                   marginBottom: messageText ? '8px' : '0'
                                 }}
                               >
                                 <source src={message.mediaUrl} />
                               </audio>
                             );
                                                       } else if (isDocument) {
                              // Layout estilo WhatsApp para documentos
                              // Extrair APENAS o nome do arquivo, ignorando legenda e assinatura
                              let fileName = 'Documento';
                              let originalBody = message.body || '';
                              
                              // Primeira tentativa: extrair da URL se disponível
                              if (message.mediaUrl) {
                                const urlParts = message.mediaUrl.split('/');
                                const lastPart = urlParts[urlParts.length - 1];
                                if (lastPart && lastPart.includes('.')) {
                                  fileName = decodeURIComponent(lastPart);
                                }
                              }
                              
                              // Se não conseguiu da URL, procura no body
                              if ((!fileName || fileName === 'Documento') && originalBody) {
                                // Remove assinatura se existir
                                let bodyToSearch = originalBody;
                                if (originalBody.includes('*') && originalBody.includes(':*')) {
                                  bodyToSearch = originalBody.replace(/\*[^:]+:\*\s*/, '').trim();
                                }
                                
                                // Procura por linhas que parecem ser nomes de arquivo
                                const lines = bodyToSearch.split('\n').filter(line => line.trim());
                                for (const line of lines) {
                                  const trimmedLine = line.trim();
                                  // Verifica se é um nome de arquivo (contém extensão)
                                  if (trimmedLine && /\.\w{2,4}$/.test(trimmedLine) && 
                                      !trimmedLine.includes('Mensagem') && 
                                      !trimmedLine.includes('suportada')) {
                                    fileName = trimmedLine;
                                    break;
                                  }
                                }
                              }
                              
                              // Fallback final
                              if (!fileName || fileName === 'Documento' || fileName.trim() === '') {
                                fileName = 'Documento.pdf';
                              }
                              const getDocumentIcon = (fileName) => {
                                if (!fileName) return <Description style={{ fontSize: 28, color: '#1976d2' }} />;
                                const extension = fileName.toLowerCase().split('.').pop();
                                switch (extension) {
                                  case 'pdf':
                                    return <PictureAsPdf style={{ fontSize: 28, color: '#d32f2f' }} />;
                                  case 'doc':
                                  case 'docx':
                                    return <Description style={{ fontSize: 28, color: '#1976d2' }} />;
                                  default:
                                    return <Description style={{ fontSize: 28, color: '#1976d2' }} />;
                                }
                              };
                              
                                                             const getOriginalFileName = (fileName) => {
                                 if (!fileName) return fileName;
                                 
                                 // Remove timestamps e caracteres desnecessários
                                 let cleanName = fileName;
                                 
                                 // Remove timestamp do início (ex: 1750034602009_)
                                 cleanName = cleanName.replace(/^\d+_/, '');
                                 
                                 // Remove timestamp antes da extensão (ex: _1750034602009.pdf)
                                 cleanName = cleanName.replace(/_\d+(\.\w+)$/, '$1');
                                 
                                 // Substitui underscores por espaços para melhor legibilidade
                                 cleanName = cleanName.replace(/_/g, ' ');
                                 
                                 return cleanName;
                               };
                              
                              return (
                                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                                  padding: '12px 16px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '8px',
                                  maxWidth: '350px',
                                  minWidth: '250px',
                                  marginBottom: messageText ? '8px' : '0',
                                  border: '1px solid #e9ecef'
                                }}>
                                  <div style={{
                                    width: '48px',
                                    height: '48px',
                                    marginRight: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: '#e3f2fd'
                                  }}>
                                    {getDocumentIcon(fileName)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      color: '#303030',
                                      marginBottom: '2px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {getOriginalFileName(fileName)}
                                    </div>
                                    <div style={{
                                      fontSize: '12px',
                                      color: '#667781'
                                    }}>
                                      {(() => {
                                        const extension = fileName.toLowerCase().split('.').pop()?.toUpperCase() || 'DOC';
                                        // Tenta extrair tamanho do fileName se estiver no formato "nome • tamanho"
                                        if (fileName.includes('•') && fileName.includes('KB')) {
                                          const sizePart = fileName.split('•')[1]?.trim();
                                          return `${extension} • ${sizePart}`;
                                        }
                                        return extension;
                                      })()}
                                    </div>
                                  </div>
                                  <GetApp 
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      color: '#667781',
                                      marginLeft: '8px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      if (message.mediaUrl) {
                                        window.open(message.mediaUrl, '_blank');
                                      }
                                    }}
                                  />
                                </div>
                              );
                            } else {
                              // Para outros tipos de mídia não reconhecidos, não renderizar nada
                              // O texto da mensagem será mostrado normalmente abaixo
                              return null;
                            }
                         }
                         return null;
                       };
                       
                       // Extrair assinatura e legenda separadamente para documentos
                       let documentSignature = '';
                       let documentCaption = '';
                       if (isDocument && message.body && message.body.includes('*') && message.body.includes(':*')) {
                         const signatureMatch = message.body.match(/\*([^:]+):\*\n?(.*)/s);
                         if (signatureMatch) {
                           documentSignature = signatureMatch[1];
                           // Extrair legenda (texto após a assinatura, excluindo nome do arquivo)
                           let caption = signatureMatch[2] || '';
                           if (caption) {
                             // Remove nome do arquivo se estiver presente
                             const lines = caption.split('\n').filter(line => line.trim());
                             const cleanLines = lines.filter(line => 
                               !(/^\d+_.*\.\w+$/.test(line.trim()) || 
                                 /^\d+\.\w+$/.test(line.trim()))
                             );
                             documentCaption = cleanLines.join('\n').trim();
                           }
                         }
                       }

                       return (
                         <div 
                           key={message.id || index}
                           style={{
                             alignSelf: message.fromMe ? 'flex-end' : 'flex-start',
                             maxWidth: '70%',
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '4px'
                           }}
                         >
                           {/* Container da mensagem */}
                           <div style={{
                             padding: '8px 12px',
                             borderRadius: '12px',
                             backgroundColor: isPrivate ? '#afeaff' : (message.fromMe ? '#dcf8c6' : '#ffffff'),
                             border: message.fromMe ? 'none' : '1px solid #e0e0e0',
                             wordBreak: 'break-word'
                           }}>
                             {/* Nome do usuário em assinatura (apenas para não-documentos) */}
                             {displayName && !isDocument && (
                               <Typography 
                                 variant="body2" 
                                 style={{ 
                                   fontSize: '13px',
                                   fontWeight: 'bold',
                                   color: isPrivate ? '#0066cc' : '#000000',
                                   marginBottom: '4px'
                                 }}
                               >
                                 {displayName}
                               </Typography>
                             )}
                             
                             {/* Mídia */}
                             {renderMedia()}
                             
                                                           {/* Texto da mensagem */}
                              {messageText && 
                               !message.body?.includes('BEGIN:VCARD') && (
                                <Typography 
                                  variant="body2" 
                                  style={{ 
                                    fontSize: '14px',
                                    fontWeight: isPrivate ? 'bold' : 'normal',
                                    color: isPrivate ? '#0066cc' : 'inherit'
                                  }}
                                >
                                  {messageText}
                                </Typography>
                              )}
                              
                              {/* Para documentos: assinatura e legenda ABAIXO do documento (como no MessagesList) */}
                              {((isDocument && message.body && !isDocumentFile(message.body)) || 
                                (isDocument && documentSignature) || 
                                (isDocument && documentCaption)) && (
                                <div style={{ marginTop: '8px' }}>
                                  {/* Assinatura do documento */}
                                  {documentSignature && (
                                    <Typography 
                                      variant="body2" 
                                      style={{ 
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        marginBottom: '2px'
                                      }}
                                    >
                                      {documentSignature}:
                                    </Typography>
                                  )}
                                  
                                  {/* Legenda do documento */}
                                  {documentCaption && (
                                    <Typography 
                                      variant="body2" 
                                      style={{ 
                                        fontSize: '14px',
                                        color: 'inherit'
                                      }}
                                    >
                                      {documentCaption}
                                    </Typography>
                                  )}
                                </div>
                              )}
                              
                              {/* vCard ou contactMessage */}
                              {(message.vCard || message.body?.includes('BEGIN:VCARD')) && (
                                <div style={{ 
                                  padding: '12px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '12px',
                                  border: '1px solid #e9ecef',
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '12px',
                                  minWidth: '200px',
                                  marginBottom: messageText ? '8px' : '0'
                                }}>
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#25D366',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Person style={{ color: 'white', fontSize: '20px' }} />
                                  </div>
                                  <div>
                                    <Typography variant="body2" style={{ fontWeight: 'bold', color: '#333' }}>
                                      {(() => {
                                        if (message.contact?.name) return message.contact.name;
                                        if (message.body?.includes('FN:')) {
                                          const fnMatch = message.body.match(/FN:([^\\n\\r]+)/);
                                          return fnMatch ? fnMatch[1] : 'Contato';
                                        }
                                        return 'Contato';
                                      })()}
                                    </Typography>
                                    <Typography variant="caption" style={{ color: '#666' }}>
                                      CONVERSAR
                                    </Typography>
                                  </div>
                                </div>
                              )}
                              
                              {/* Timestamp */}
                              <Typography 
                                variant="caption" 
                                style={{
                                  fontSize: '11px', 
                                  color: '#666',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  marginTop: '4px'
                                }}
                              >
                                {new Date(message.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {renderMessageAck(message, classes)}
                              </Typography>
                            </div>


                         </div>
                       );
                     })}
                     {/* Referência para scroll automático */}
                     <div ref={messagesEndRef} />
                   </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Typography variant="body2" color="textSecondary">
                      Nenhuma mensagem encontrada neste ticket.
                    </Typography>
                  </div>
                )}
              </div>
              
              {/* Input de Mensagem Avançado */}
              <div style={{ 
                borderTop: '1px solid #e0e0e0',
                paddingTop: '16px',
                backgroundColor: '#fff'
              }}>
                {/* Barra de ferramentas superior */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <Tooltip title="Anexar arquivo">
                    <IconButton size="small" onClick={handleOpenMenuClick}>
                      <AttachFile />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Emojis">
                    <IconButton size="small" onClick={() => setShowEmoji(!showEmoji)}>
                      <EmojiEmotions />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Agendar mensagem">
                    <IconButton size="small" onClick={() => setAppointmentModalOpen(true)}>
                      <Event />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Mensagem privada">
                    <IconButton 
                      size="small" 
                      onClick={handlePrivateMessage}
                      style={{ color: privateMessage ? '#25D366' : 'grey' }}
                    >
                      <Comment />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Assinatura">
                    <IconButton 
                      size="small" 
                      onClick={handleChangeSign}
                      style={{ color: signMessage ? '#25D366' : 'grey' }}
                    >
                      <Create />
                    </IconButton>
                  </Tooltip>
                </div>

                {/* Campo de input com botões laterais */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    variant="outlined"
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          handleSendSimpleMessage();
                        }
                      }
                    }}
                    style={{ 
                      backgroundColor: '#fff',
                      borderRadius: '20px'
                    }}
                    InputProps={{
                      style: {
                        borderRadius: '20px',
                        paddingRight: '8px'
                      }
                    }}
                  />
                  
                  {/* Botões de ação direita */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '56px' }}>
                    {messageText.trim() ? (
                      <Tooltip title="Enviar mensagem">
                        <span>
                          <IconButton 
                            color="primary"
                            onClick={handleSendSimpleMessage}
                            disabled={loadingMessages}
                            style={{ 
                              backgroundColor: '#25D366',
                              color: 'white',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {loadingMessages ? <CircularProgress size={20} color="inherit" /> : <Send />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : recording ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Tooltip title="Cancelar gravação">
                          <IconButton 
                            onClick={handleCancelAudio}
                            style={{ color: '#f44336' }}
                          >
                            <HighlightOff />
                          </IconButton>
                        </Tooltip>
                        
                        <Typography variant="body2" style={{ 
                          color: '#f44336', 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          fontFamily: 'monospace'
                        }}>
                          {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                          {(recordingTime % 60).toString().padStart(2, '0')}
                        </Typography>
                        
                        <Tooltip title="Enviar áudio">
                          <span>
                            <IconButton 
                              onClick={handleUploadAudio}
                              disabled={loadingMessages}
                              style={{ 
                                backgroundColor: '#25D366',
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {loadingMessages ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutline />}
                            </IconButton>
                          </span>
                        </Tooltip>
        </div>
                    ) : (
                      <>
                        <Tooltip title="Enviar áudio">
                          <span>
                            <IconButton 
                              color="primary"
                              onClick={handleStartRecording}
                              disabled={loadingMessages}
                              style={{ 
                                backgroundColor: '#25D366',
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Mic />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    )}
      </div>
    </div>
                
                {/* Picker de Emoji */}
                {showEmoji && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '80px', 
                    left: '16px',
                    zIndex: 1000
                  }}>
                    <ClickAwayListener onClickAway={() => setShowEmoji(false)}>
                      <div>
                        <Picker
                          perLine={9}
                          theme="light"
                          set="google"
                          showPreview={true}
                          showSkinTones={false}
                          onSelect={handleAddEmoji}
                        />
                      </div>
                    </ClickAwayListener>
                  </div>
                )}
                
                {/* Menu de Anexos */}
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuItemClick}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  style={{ marginTop: '-8px' }}
                >
                  <MenuItem onClick={handleMenuItemClick}>
                    <input
                      multiple
                      type="file"
                      id="upload-img-button-modal"
                      accept="image/*, video/*"
                      style={{ display: 'none' }}
                      onChange={handleChangePhotosVideos}
                    />
                    <label htmlFor="upload-img-button-modal" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <PermMedia style={{ color: '#E91E63' }} />
                      Fotos e vídeos
                    </label>
                  </MenuItem>
                  
                  <MenuItem onClick={handleCameraModalOpen}>
                    <CameraAlt style={{ color: '#FF9800', marginRight: '8px' }} />
                    Câmera
                  </MenuItem>
                  
                  <MenuItem onClick={handleMenuItemClick}>
                    <input
                      multiple
                      type="file"
                      id="upload-doc-button-modal"
                      accept="application/*, text/*"
                      style={{ display: 'none' }}
                      onChange={handleChangeDocuments}
                    />
                    <label htmlFor="upload-doc-button-modal" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Description style={{ color: '#2196F3' }} />
                      Documento
                    </label>
                  </MenuItem>
                  
                  <MenuItem onClick={handleSendContactModalOpen}>
                    <Person style={{ color: '#9C27B0', marginRight: '8px' }} />
                    Contato
                  </MenuItem>
                </Menu>
              </div>
            </div>
          )}
        </DialogContent>
        
        <DialogActions style={{ padding: '8px 16px', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleCloseMessageModal}
            color="secondary"
            size="small"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modais Auxiliares */}
      {modalCameraOpen && (
        <CameraModal
          isOpen={modalCameraOpen}
          onRequestClose={() => setModalCameraOpen(false)}
          onCapture={handleCapture}
          disablePortal
        />
      )}
      
      {senVcardModalOpen && (
        <ContactSendModal
          modalOpen={senVcardModalOpen}
          onClose={handleSendContatcMessage}
          disablePortal
        />
      )}
      
      {appointmentModalOpen && (
        <ScheduleModal
          open={appointmentModalOpen}
          onClose={() => setAppointmentModalOpen(false)}
          message={messageText}
          contactId={selectedTicket?.contact?.id}
          disablePortal
        />
      )}
      
      {showModalMedias && (
        <MessageUploadMedias
          isOpen={showModalMedias}
          files={mediasUpload}
          onClose={handleCloseModalMedias}
          onSend={handleUploadMedia}
          onCancelSelection={handleCancelSelection}
        />
      )}

    </MainContainer>
    </>
  );
};

// Função para verificar se é um documento baseado na extensão
const isDocumentFile = (fileName) => {
  if (!fileName) return false;
  
  const extension = fileName.toLowerCase().split('.').pop();
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
  
  return documentExtensions.includes(extension);
};

// Função para renderizar ícones de confirmação (ack) das mensagens
const renderMessageAck = (message, classes) => {
  // Só mostra ack para mensagens enviadas por mim
  if (!message.fromMe) return null;
  
  if (message.ack === 0) {
    return <AccessTime fontSize="small" className={classes.ackIcons} />;
  } else if (message.ack === 1) {
    return <Done fontSize="small" className={classes.ackIcons} />;
  } else if (message.ack === 2) {
    return <DoneAll fontSize="small" className={classes.ackIcons} />;
  } else if (message.ack === 3 || message.ack === 4) {
    return <DoneAll fontSize="small" className={message.mediaType === "audio" ? classes.ackPlayedIcon : classes.ackDoneAllIcon} />;
  } else if (message.ack === 5) {
    return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
  }
  return null;
};

// Função para formatar telefone brasileiro - usada no modal
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove o código do país (55) se existir
  let cleanNumber = phoneNumber.replace(/^\+?55/, '');
  
  // Remove caracteres não numéricos
  cleanNumber = cleanNumber.replace(/\D/g, '');
  
  // Adiciona o 9 na frente se for celular e não tiver
  if (cleanNumber.length === 10 && ['6', '7', '8', '9'].includes(cleanNumber[2])) {
    cleanNumber = cleanNumber.slice(0, 2) + '9' + cleanNumber.slice(2);
  }
  
  // Formata no padrão (99) 99999-9999
  if (cleanNumber.length === 11) {
    return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 7)}-${cleanNumber.slice(7)}`;
  }
  
  // Se não conseguir formatar, retorna o número original
  return phoneNumber;
};

export default Kanban;
