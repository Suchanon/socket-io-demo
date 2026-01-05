'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: number;
    text: string;
    username: string;
    timestamp: string;
}

interface TypingStatus {
    username: string;
    isTyping: boolean;
}

export function useSocket(serverUrl: string = 'http://localhost:4000') {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Create socket connection
        const socketInstance = io(serverUrl, {
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        // Listen for incoming messages
        socketInstance.on('message:receive', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Listen for user joins
        socketInstance.on('user:joined', (data: { users: string[] }) => {
            setUsers(data.users);
        });

        // Listen for user leaves
        socketInstance.on('user:left', (data: { users: string[] }) => {
            setUsers(data.users);
        });

        // Listen for typing indicators
        socketInstance.on('user:typing', (data: TypingStatus) => {
            setTypingUsers((prev) => ({
                ...prev,
                [data.username]: data.isTyping,
            }));
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [serverUrl]);

    // Join chat with username
    const joinChat = useCallback(
        (username: string) => {
            if (socket) {
                socket.emit('user:join', username);
            }
        },
        [socket]
    );

    // Send a message
    const sendMessage = useCallback(
        (text: string) => {
            if (socket && text.trim()) {
                socket.emit('message:send', { text });
            }
        },
        [socket]
    );

    // Emit typing status
    const setTyping = useCallback(
        (isTyping: boolean) => {
            if (socket) {
                socket.emit('user:typing', isTyping);
            }
        },
        [socket]
    );

    return {
        isConnected,
        messages,
        users,
        typingUsers,
        joinChat,
        sendMessage,
        setTyping,
    };
}
