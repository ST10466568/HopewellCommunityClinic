import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  X,
  RefreshCw,
  User
} from 'lucide-react';
import { notificationsAPI } from '../services/api';

interface Notification {
  id: string;
  type: string;
  status: string;
  sentAt?: string;
  emailSubject: string;
  emailContent?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  serviceName?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  isRead?: boolean;
  threadId?: string;
  replies?: Message[];
}

interface Message {
  id: string;
  notificationId: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

interface NotificationCenterProps {
  userId: string;
  userRole: 'patient' | 'doctor' | 'nurse' | 'admin';
  patientId?: string;
  staffId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  userRole,
  patientId,
  staffId,
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId, patientId, staffId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      let data: any[] = [];
      
      if (userRole === 'patient' && patientId) {
        data = await notificationsAPI.getPatientNotifications(patientId);
      } else if ((userRole === 'doctor' || userRole === 'nurse') && staffId) {
        data = await notificationsAPI.getStaffNotifications(staffId);
      } else if (userRole === 'admin') {
        data = await notificationsAPI.getAllNotifications();
      }
      
      // Ensure data is an array and load replies for each notification
      const notificationsWithReplies = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (notif) => {
          try {
            const replies = await notificationsAPI.getNotificationReplies(notif.id);
            return {
              ...notif,
              replies: Array.isArray(replies) ? replies : [],
              isRead: notif.isRead || false
            };
          } catch (error) {
            return {
              ...notif,
              replies: [],
              isRead: notif.isRead || false
            };
          }
        })
      );
      
      setNotifications(notificationsWithReplies);
      setUnreadCount(notificationsWithReplies.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedNotification || !replyMessage.trim()) return;
    
    try {
      setIsSendingReply(true);
      await notificationsAPI.replyToNotification(
        selectedNotification.id,
        userId,
        replyMessage.trim(),
        userRole
      );
      
      // Reload notifications to get updated replies
      await loadNotifications();
      
      // Update selected notification with new reply
      const updated = await notificationsAPI.getNotificationReplies(selectedNotification.id);
      setSelectedNotification({
        ...selectedNotification,
        replies: Array.isArray(updated) ? updated : []
      });
      
      setReplyMessage('');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      alert(error.message || 'Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSelectNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case '24h_reminder':
      case 'appointment_reminder_24h':
        return '24h Reminder';
      case '2h_reminder':
      case 'appointment_reminder_2h':
        return '2h Reminder';
      case 'custom':
        return 'Message';
      case 'reply':
        return 'Reply';
      default:
        return type;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case '24h_reminder':
      case 'appointment_reminder_24h':
        return <Calendar className="h-4 w-4" />;
      case '2h_reminder':
      case 'appointment_reminder_2h':
        return <AlertCircle className="h-4 w-4" />;
      case 'custom':
      case 'reply':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex">
          {/* Notifications List */}
          <div className="w-1/2 border-r pr-4 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleSelectNotification(notification)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedNotification?.id === notification.id
                        ? 'bg-primary/10 border-primary'
                        : notification.isRead
                        ? 'hover:bg-muted/50'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.emailSubject}
                            </h4>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.sentAt
                              ? new Date(notification.sentAt).toLocaleString()
                              : 'Recently'}
                          </p>
                          {notification.senderName && (
                            <p className="text-xs text-muted-foreground">
                              From: {notification.senderName}
                            </p>
                          )}
                          {notification.replies && notification.replies.length > 0 && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {notification.replies.length} {notification.replies.length === 1 ? 'reply' : 'replies'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Details and Replies */}
          <div className="w-1/2 pl-4 overflow-y-auto flex flex-col">
            {selectedNotification ? (
              <>
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getNotificationTypeIcon(selectedNotification.type)}
                      <h3 className="font-semibold text-lg">
                        {selectedNotification.emailSubject}
                      </h3>
                      <Badge variant="outline">
                        {getNotificationTypeLabel(selectedNotification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedNotification.sentAt
                        ? new Date(selectedNotification.sentAt).toLocaleString()
                        : 'Recently'}
                    </p>
                    {selectedNotification.senderName && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>From: {selectedNotification.senderName}</span>
                      </div>
                    )}
                    {selectedNotification.emailContent && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedNotification.emailContent}
                        </p>
                      </div>
                    )}
                    {selectedNotification.appointmentDate && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Appointment: {selectedNotification.appointmentDate} at{' '}
                            {selectedNotification.appointmentTime}
                          </span>
                        </div>
                        {selectedNotification.serviceName && (
                          <p className="text-sm mt-1">Service: {selectedNotification.serviceName}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Replies Section */}
                  {selectedNotification.replies && selectedNotification.replies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-3">Conversation</h4>
                      <div className="space-y-3">
                        {selectedNotification.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.senderRole === userRole
                                ? 'bg-primary/10 ml-4'
                                : 'bg-muted mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {reply.senderName} ({reply.senderRole})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.sentAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="mt-4 pt-4 border-t">
                  <Label htmlFor="reply-message">Send Reply</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      id="reply-message"
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendReply();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSendingReply}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingReply ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Ctrl+Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a notification to view details</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;

