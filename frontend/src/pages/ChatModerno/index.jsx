import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../utils/cn';

// Context
import { AuthContext } from '../../context/Auth/AuthContext';

// Nossos componentes UI
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import ScrollArea from '../../components/ui/ScrollArea';
import ChatPageBase from '../../components/ChatPageBase';

// Componentes do Chat
import ContactList from '../Chat/components/ContactList';
import ChatHeader from '../Chat/components/ChatHeader';
import MessageItem from '../Chat/components/MessageItem';
import MessageInput from '../Chat/components/MessageInput';
import ConversationInfo from '../Chat/components/ConversationInfo';

// Mock data e API
import {
  getContacts,
  getMessages,
  getProfile,
  sendMessage,
  deleteMessage,
  isObjectNotEmpty
} from '../Chat/data/mockData';

// Icons
import { 
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 40px)',
  gap: '16px',
  position: 'relative',
  backgroundColor: '#EEF1F9',
  borderRadius: '12px',
  padding: '12px',
  overflow: 'hidden',
  
  // Dark mode
  '@media (prefers-color-scheme: dark)': {
    backgroundColor: 'var(--bg-primary)',
  },
  
  [theme.breakpoints.down('md')]: {
    height: 'calc(100vh - 32px)',
    gap: '0',
    padding: '8px',
  },
}));

const SidebarContainer = styled(Box)(({ theme, isOpen }) => ({
  width: '320px',
  flexShrink: 0,
  transition: 'all 0.3s ease',
  height: '100%',
  overflow: 'hidden',
  
  [theme.breakpoints.down('md')]: {
    position: 'absolute',
    left: isOpen ? 0 : '-100%',
    top: 0,
    height: '100%',
    width: '280px',
    zIndex: 1000,
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-primary)',
  },
}));

const ChatArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: '100%',
  overflow: 'hidden',
}));

const MessageArea = styled(Box)(() => ({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
  height: '100%',
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 999,
  display: 'none',
  
  [theme.breakpoints.down('md')]: {
    display: 'block',
  },
}));

const ChatModerno = () => {
  // Estados
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Estados do chat
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reply, setReply] = useState(false);
  const [replyData, setReplyData] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isForward, setIsForward] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatHeightRef = useRef(null);
  
  // Hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatHeightRef.current) {
      const scrollElement = chatHeightRef.current.querySelector('[data-scrollable]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Load contacts and profile
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [contactsData, profileData] = await Promise.all([
          getContacts(),
          getProfile()
        ]);
        
        setContacts(contactsData.contacts || []);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    
    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const messagesData = await getMessages(selectedChatId);
        setMessages(messagesData.chat?.chat || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle chat selection
  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    setReply(false);
    setReplyData({});
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (message) => {
    if (!selectedChatId || !message.trim()) return;
    
    const contact = contacts.find(c => c.id === selectedChatId);
    if (!contact) return;
    
    try {
      const newMessage = {
        message: message,
        contact: { id: selectedChatId },
        replayMetadata: isObjectNotEmpty(replyData) ? replyData : null,
      };
      
      await sendMessage(newMessage);
      
      // Reload messages
      const messagesData = await getMessages(selectedChatId);
      setMessages(messagesData.chat?.chat || []);
      
      // Clear reply
      setReply(false);
      setReplyData({});
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (selectedChatId, index) => {
    try {
      await deleteMessage({ selectedChatId, index });
      
      // Remove from pinned messages if exists
      setPinnedMessages(prev => 
        prev.filter(msg => !(msg.chatId === selectedChatId && msg.index === index))
      );
      
      // Reload messages
      const messagesData = await getMessages(selectedChatId);
      setMessages(messagesData.chat?.chat || []);
      
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle reply
  const handleReply = (message, contact) => {
    setReply(true);
    setReplyData({
      message: message,
      contact: contact,
    });
  };

  // Handle pin message
  const handlePinMessage = (messageData) => {
    setPinnedMessages(prev => {
      const exists = prev.find(msg => msg.id === messageData.id);
      
      if (exists) {
        // Unpin
        return prev.filter(msg => msg.id !== messageData.id);
      } else {
        // Pin
        return [...prev, messageData];
      }
    });
  };

  // Handle forward
  const handleForward = () => {
    setIsForward(!isForward);
  };

  // Handle show info
  const handleShowInfo = () => {
    setShowInfo(!showInfo);
  };

  // Handle mobile sidebar
  const handleShowSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Get selected contact
  const selectedContact = contacts.find(c => c.id === selectedChatId);

  // Loading state
  if (loading) {
    return (
      <ChatPageBase
        title=""
        showBreadcrumb={false}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px' 
        }}>
          <Typography>Carregando chat...</Typography>
        </Box>
      </ChatPageBase>
    );
  }

  return (
    <ChatPageBase
      title=""
      showBreadcrumb={false}
    >
      <Box sx={{
        display: 'flex',
        height: '100%',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '20px'
      }}>
        {/* Overlay for mobile */}
        {isMobile && showSidebar && (
          <Overlay onClick={() => setShowSidebar(false)} />
        )}

        {/* Sidebar - Lista de Contatos */}
        <SidebarContainer isOpen={showSidebar}>
          <Card sx={{ 
            height: 'calc(100vh - 108px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CardHeader sx={{ pb: 2, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Conversas
              </Typography>
            </CardHeader>
            
            <CardContent sx={{ 
              flex: 1, 
              p: 0, 
              overflow: 'hidden',
              minHeight: 0
            }}>
              <ScrollArea size="full">
                <Box data-scrollable>
                  {contacts.map((contact) => (
                    <ContactList
                      key={contact.id}
                      contact={contact}
                      selectedChatId={selectedChatId}
                      openChat={openChat}
                    />
                  ))}
                </Box>
              </ScrollArea>
            </CardContent>
          </Card>
        </SidebarContainer>

        {/* Chat Area */}
        <ChatArea>
          <Card sx={{ 
            height: 'calc(100vh - 108px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Chat Header */}
            <CardHeader sx={{ p: 0, mb: 0, flexShrink: 0 }}>
              <ChatHeader
                contact={selectedContact}
                showInfo={showInfo}
                handleShowInfo={handleShowInfo}
                profile={profile}
                mobileMenuHandler={handleShowSidebar}
                onSearch={() => {/* TODO: Implement search */}}
              />
            </CardHeader>

            {selectedChatId ? (
              <>
                {/* Messages Area */}
                <CardContent sx={{ 
                  flex: 1, 
                  p: 0, 
                  overflow: 'hidden',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <MessageArea ref={chatHeightRef}>
                    <ScrollArea size="full">
                      <Box data-scrollable sx={{ p: 2 }}>
                        {messagesLoading ? (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            py: 4 
                          }}>
                            <Typography>Carregando mensagens...</Typography>
                          </Box>
                        ) : (
                          <>
                            {messages.map((message, index) => (
                              <MessageItem
                                key={`message-${index}-${message.id}`}
                                message={message}
                                contact={selectedContact}
                                profile={profile}
                                onDelete={handleDeleteMessage}
                                index={index}
                                selectedChatId={selectedChatId}
                                handleReply={handleReply}
                                replyData={replyData}
                                handleForward={handleForward}
                                handlePinMessage={handlePinMessage}
                                pinnedMessages={pinnedMessages}
                              />
                            ))}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </Box>
                    </ScrollArea>
                  </MessageArea>
                </CardContent>

                {/* Message Input */}
                <Box sx={{ 
                  borderTop: '1px solid var(--border-primary)',
                  flexShrink: 0
                }}>
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    reply={reply}
                    setReply={setReply}
                    replyData={replyData}
                    disabled={messagesLoading}
                  />
                </Box>
              </>
            ) : (
              /* Empty State */
              <CardContent sx={{ flex: 1, display: 'flex' }}>
                <EmptyState>
                  <ChatBubbleLeftRightIcon style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Bem-vindo ao Chat Moderno
                  </Typography>
                  <Typography variant="body2">
                    Selecione uma conversa para começar a trocar mensagens
                  </Typography>
                </EmptyState>
              </CardContent>
            )}
          </Card>
        </ChatArea>

        {/* Conversation Info Panel */}
        {showInfo && selectedContact && (
          <ConversationInfo 
            contact={selectedContact}
            onClose={handleShowInfo}
            showInfo={showInfo}
          />
        )}
      </Box>
    </ChatPageBase>
  );
};

export default ChatModerno;