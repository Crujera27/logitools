import { Server } from 'socket.io';
import executeQuery from '../tools/mysql.mjs';
import log from '../tools/log.mjs';

let io;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_MISSED_HEARTBEATS = 3;
const INACTIVITY_TIMEOUT = 3600000; // 1 hour in milliseconds

export function initializeSocket(server) {
    io = new Server(server, {
        pingTimeout: 60000, // Faster ping timeout detection
        pingInterval: 25000 // More frequent pings
    });
    
    io.on('connection', (socket) => {
        let missedHeartbeats = 0;
        let lastActivity = Date.now();

        // Authenticate socket connection
        socket.on('authenticate', async (data) => {
            if (!data.isStaff) {
                socket.disconnect();
                return;
            }
            socket.join('staff');
            socket.emit('authenticated');
        });

        // Track activity through heartbeats
        socket.on('heartbeat', () => {
            missedHeartbeats = 0;
            lastActivity = Date.now();
        });

        // Check both heartbeat and activity
        const healthCheck = setInterval(() => {
            missedHeartbeats++;
            
            // Check for inactivity
            if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
                clearInterval(healthCheck);
                socket.emit('inactive');
                socket.disconnect();
                return;
            }

            // Check for missed heartbeats
            if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
                clearInterval(healthCheck);
                socket.disconnect();
                return;
            }

            socket.emit('ping');
        }, HEARTBEAT_INTERVAL);

        socket.on('disconnect', () => {
            clearInterval(healthCheck);
        });
    });

    // Start ticket update broadcast
    startTicketBroadcast();
}

async function startTicketBroadcast() {
    setInterval(async () => {
        try {
            const tickets = await executeQuery(`
                SELECT t.*, u.username, 
                       COUNT(m.message_id) as message_count 
                FROM tickets t 
                LEFT JOIN users u ON t.user_id = u.id 
                LEFT JOIN ticket_messages m ON t.ticket_id = m.ticket_id 
                GROUP BY t.ticket_id 
                ORDER BY t.created_at DESC`);

            io.to('staff').emit('ticketUpdate', {
                tickets,
                lastUpdate: new Date()
            });
        } catch (error) {
            log(error, 'err');
        }
    }, 10000); // Update every 10 seconds
}

export function emitTicketUpdate(ticketId) {
    if (!io) return;
    io.to('staff').emit('ticketChanged', { ticketId });
}