import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Send, Search } from 'lucide-react';
import { notificationsAPI, patientsAPI, staffAPI } from '../services/api';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userId?: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  userId?: string;
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderId: string;
  senderRole: 'doctor' | 'nurse' | 'admin';
  senderName: string;
  existingPatients?: Patient[];
  existingStaff?: Staff[];
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  senderId,
  senderRole,
  senderName,
  existingPatients = [],
  existingStaff = []
}) => {
  const [recipientType, setRecipientType] = useState<'patient' | 'staff'>('patient');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [patients, setPatients] = useState<Patient[]>(existingPatients);
  const [staff, setStaff] = useState<Staff[]>(existingStaff);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecipients();
      // Reset form
      setRecipientType('patient');
      setSelectedRecipient('');
      setSearchTerm('');
      setSubject('');
      setMessage('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const loadRecipients = async () => {
    try {
      setIsLoading(true);
      
      // Load patients if not provided or empty
      if (patients.length === 0) {
        try {
          const patientsData = await patientsAPI.getAll();
          setPatients(patientsData || []);
        } catch (error) {
          console.error('Error loading patients:', error);
          setPatients([]);
        }
      } else {
        setPatients(existingPatients);
      }

      // Load staff if not provided or empty
      if (staff.length === 0) {
        try {
          const staffData = await staffAPI.getAll();
          setStaff(staffData || []);
        } catch (error) {
          console.error('Error loading staff:', error);
          setStaff([]);
        }
      } else {
        setStaff(existingStaff);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredRecipients = () => {
    if (recipientType === 'patient') {
      const filtered = patients.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm))
      );
      return filtered;
    } else {
      // Filter out the sender from staff list
      const filtered = staff.filter(s => 
        s.userId !== senderId && (
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      return filtered;
    }
  };

  const handleSend = async () => {
    setError('');
    setSuccess('');

    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setIsSending(true);

      // Get recipient details
      const recipient = recipientType === 'patient'
        ? patients.find(p => (p.id === selectedRecipient || p.userId === selectedRecipient))
        : staff.find(s => (s.id === selectedRecipient || s.userId === selectedRecipient));

      if (!recipient) {
        setError('Recipient not found');
        setIsSending(false);
        return;
      }

      // Determine recipient role
      const recipientRole = recipientType === 'patient' ? 'patient' : 
                          ('role' in recipient ? recipient.role : 'staff');

      // Determine recipient ID (use userId if available, otherwise use id)
      const recipientId = recipient.userId || recipient.id;

      // Send message
      await notificationsAPI.sendMessage(
        recipientId,
        recipientRole,
        subject.trim(),
        message.trim(),
        senderId,
        senderRole
      );

      setSuccess('Message sent successfully!');
      
      // Reset form after short delay
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setSelectedRecipient('');
        setSearchTerm('');
        setSuccess('');
      }, 2000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredRecipients = getFilteredRecipients();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>
                Send a message or notification to a patient or staff member
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <Label>Recipient Type</Label>
            <div className="flex space-x-4 mt-2">
              <Button
                type="button"
                variant={recipientType === 'patient' ? 'default' : 'outline'}
                onClick={() => {
                  setRecipientType('patient');
                  setSelectedRecipient('');
                  setSearchTerm('');
                }}
              >
                Patient
              </Button>
              <Button
                type="button"
                variant={recipientType === 'staff' ? 'default' : 'outline'}
                onClick={() => {
                  setRecipientType('staff');
                  setSelectedRecipient('');
                  setSearchTerm('');
                }}
              >
                Staff
              </Button>
            </div>
          </div>

          {/* Recipient Search and Selection */}
          <div>
            <Label htmlFor="recipient-search">Search {recipientType === 'patient' ? 'Patient' : 'Staff'}</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-search"
                placeholder={`Search by name, email, or ${recipientType === 'patient' ? 'phone' : 'role'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {filteredRecipients.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                {filteredRecipients.map((recipient) => {
                  const recipientId = recipient.userId || recipient.id;
                  const isSelected = selectedRecipient === recipientId;
                  
                  return (
                    <div
                      key={recipientId}
                      onClick={() => setSelectedRecipient(recipientId)}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {recipient.firstName} {recipient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{recipient.email}</p>
                          {recipientType === 'patient' && 'phone' in recipient && recipient.phone && (
                            <p className="text-sm text-muted-foreground">{recipient.phone}</p>
                          )}
                          {recipientType === 'staff' && 'role' in recipient && (
                            <p className="text-sm text-muted-foreground capitalize">{recipient.role}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {searchTerm && filteredRecipients.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                No {recipientType === 'patient' ? 'patients' : 'staff members'} found matching your search.
              </p>
            )}

            {!searchTerm && (
              <p className="mt-2 text-sm text-muted-foreground">
                Start typing to search for a {recipientType === 'patient' ? 'patient' : 'staff member'}.
              </p>
            )}

            {selectedRecipient && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Selected Recipient:</p>
                {(() => {
                  const recipient = recipientType === 'patient'
                    ? patients.find(p => (p.id === selectedRecipient || p.userId === selectedRecipient))
                    : staff.find(s => (s.id === selectedRecipient || s.userId === selectedRecipient));
                  
                  if (!recipient) return null;
                  
                  return (
                    <p className="text-sm text-muted-foreground">
                      {recipient.firstName} {recipient.lastName} ({recipient.email})
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 min-h-[150px]"
              rows={6}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending || !selectedRecipient || !subject.trim() || !message.trim()}>
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendMessageModal;

