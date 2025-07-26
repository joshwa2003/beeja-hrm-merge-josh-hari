import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ConnectionRequestModal from './ConnectionRequestModal';

const ChatInterface = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedUserForConnection, setSelectedUserForConnection] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (messageData) => {
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat._id === messageData.chatId) {
            return {
              ...chat,
              lastMessage: {
                _id: messageData.messageId,
                content: messageData.content,
                sender: messageData.sender,
                createdAt: messageData.createdAt
              },
              lastActivity: messageData.createdAt,
              unreadCount: selectedChat?._id === chat._id ? 0 : (chat.unreadCount || 0) + 1
            };
          }
          return chat;
        });
      });
    };

    // Listen for user online/offline status
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Listen for connection requests
    const handleNewConnectionRequest = (data) => {
      console.log('=== DEBUG: handleNewConnectionRequest ===');
      console.log('Received new connection request:', data);
      setConnectionRequests(prev => {
        console.log('Previous requests:', prev);
        const updated = [data.request, ...prev];
        console.log('Updated requests:', updated);
        return updated;
      });
    };

    const handleConnectionRequestResponse = (data) => {
      if (data.action === 'approved') {
        // Refresh chats and available users
        fetchUserChats();
        fetchAvailableUsers();
      }
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('user_online', handleUserOnline);
    socketService.on('user_offline', handleUserOffline);
    socketService.on('new_connection_request', handleNewConnectionRequest);
    socketService.on('connection_request_responded', handleConnectionRequestResponse);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_online', handleUserOnline);
      socketService.off('user_offline', handleUserOffline);
      socketService.off('new_connection_request', handleNewConnectionRequest);
      socketService.off('connection_request_responded', handleConnectionRequestResponse);
    };
  }, [selectedChat]);

  // Fetch user chats
  const fetchUserChats = useCallback(async () => {
    try {
      const response = await chatAPI.getUserChats();
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
    }
  }, []);

  // Fetch available users
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await chatAPI.getAvailableUsers({ search: searchQuery });
      if (response.data.success) {
        setAvailableUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [searchQuery]);

  // Fetch connection requests (for Admin/VP)
  const fetchConnectionRequests = useCallback(async () => {
    if (['Admin', 'Vice President'].includes(user?.role)) {
      try {
        console.log('=== DEBUG: fetchConnectionRequests ===');
        console.log('User role:', user?.role);
        console.log('Fetching connection requests...');
        
        const response = await chatAPI.getConnectionRequests({ status: 'pending' });
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          console.log('Setting connection requests:', response.data.requests);
          setConnectionRequests(response.data.requests);
        } else {
          console.log('API call failed:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching connection requests:', error);
        console.error('Error details:', error.response?.data);
      }
    } else {
      console.log('User role not eligible for connection requests:', user?.role);
    }
  }, [user?.role]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUserChats(),
          fetchAvailableUsers(),
          fetchConnectionRequests()
        ]);
      } catch (error) {
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchUserChats, fetchAvailableUsers, fetchConnectionRequests]);

  // Handle chat selection
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setError('');
    
    // Join the chat room
    socketService.joinChat(chat._id);
    
    // Leave previous chat room if any
    if (selectedChat && selectedChat._id !== chat._id) {
      socketService.leaveChat(selectedChat._id);
    }
  };

  // Handle starting new chat
  const handleStartNewChat = async (otherUser) => {
    try {
      if (otherUser.needsApproval && !otherUser.canChat) {
        // Show connection request modal
        setSelectedUserForConnection(otherUser);
        setShowConnectionModal(true);
        return;
      }

      const response = await chatAPI.getOrCreateChat(otherUser._id);
      if (response.data.success) {
        const newChat = response.data.chat;
        
        // Add to chats if not already present
        setChats(prevChats => {
          const exists = prevChats.find(chat => chat._id === newChat._id);
          if (!exists) {
            return [{ ...newChat, unreadCount: 0, otherParticipant: otherUser }, ...prevChats];
          }
          return prevChats;
        });
        
        // Select the chat
        handleChatSelect({ ...newChat, otherParticipant: otherUser });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      if (error.response?.data?.needsConnectionRequest) {
        setSelectedUserForConnection(otherUser);
        setShowConnectionModal(true);
      } else {
        setError(error.response?.data?.message || 'Failed to start chat');
      }
    }
  };

  // Handle connection request
  const handleSendConnectionRequest = async (recipientId, message) => {
    try {
      console.log('=== DEBUG: handleSendConnectionRequest ===');
      console.log('Recipient ID:', recipientId);
      console.log('Message:', message);
      
      const response = await chatAPI.sendConnectionRequest(recipientId, { message });
      console.log('Send connection request response:', response.data);
      
      if (response.data.success) {
        console.log('Connection request sent successfully');
        
        // Notify via socket
        console.log('Sending socket notification...');
        socketService.sendConnectionRequestNotification(recipientId, response.data.connectionRequest);
        
        // Update available users to show pending request
        setAvailableUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === recipientId 
              ? { ...user, hasPendingRequest: true }
              : user
          )
        );
        
        setShowConnectionModal(false);
        setSelectedUserForConnection(null);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to send connection request');
    }
  };

  // Handle connection request response
  const handleConnectionRequestResponse = async (requestId, action, responseMessage = '') => {
    try {
      const response = await chatAPI.respondToConnectionRequest(requestId, {
        action,
        responseMessage
      });
      
      if (response.data.success) {
        // Remove from pending requests
        setConnectionRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Notify via socket
        const request = connectionRequests.find(req => req._id === requestId);
        if (request) {
          socketService.sendConnectionRequestResponse(
            request.requester._id,
            action,
            response.data.request
          );
        }
        
        // If approved, refresh chats
        if (action === 'approve') {
          fetchUserChats();
        }
      }
    } catch (error) {
      console.error('Error responding to connection request:', error);
      setError(error.response?.data?.message || 'Failed to respond to request');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#20C997' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'auto', p: 0, m: 0 }}>
      <Grid container sx={{ height: '100%', m: 0 }}>
        {/* Chat Sidebar */}
        <Grid
          item
          xs={12}
          md={4}
          lg={3}
          sx={{
            p: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ChatSidebar
            chats={chats}
            availableUsers={availableUsers}
            connectionRequests={connectionRequests}
            selectedChat={selectedChat}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onChatSelect={handleChatSelect}
            onStartNewChat={handleStartNewChat}
            onConnectionRequestResponse={handleConnectionRequestResponse}
            onlineUsers={onlineUsers}
            currentUser={user}
          />
        </Grid>

        {/* Chat Window */}
        <Grid item xs={12} md={8} lg={9} sx={{ p: 0 }}>
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUser={user}
              onChatUpdate={(updatedChat) => {
                setChats(prevChats =>
                  prevChats.map(chat =>
                    chat._id === updatedChat._id ? updatedChat : chat
                  )
                );
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  fontSize: '4rem',
                  mb: 2,
                  color: 'text.disabled',
                }}
              >
                💬
              </Box>
              <Box
                component="h5"
                sx={{
                  mb: 1,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Select a chat to start messaging
              </Box>
              <Box component="p" sx={{ color: 'text.secondary' }}>
                Choose from your existing conversations or start a new one
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Connection Request Modal */}
      {showConnectionModal && selectedUserForConnection && (
        <ConnectionRequestModal
          user={selectedUserForConnection}
          onSend={handleSendConnectionRequest}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedUserForConnection(null);
          }}
        />
      )}
    </Box>
  );
};

export default ChatInterface;
