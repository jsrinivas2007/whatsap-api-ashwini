"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
import { Filter, MessageSquare, MessageSquarePlus, Plus, Search, Send, Smile, Paperclip, CheckCheck, Tag, ClipboardList, StickyNote, Info, ChevronUp, ChevronDown } from 'lucide-react';
import CyberToggle from '@/components/ui/CyberToggle';
import StartChatModal from './StartChatModal';

type ChatTab = 'all' | 'active' | 'mine';

type Conversation = {
  id: string;
  name: string;
  phone: string;
  preview: string;
  time: string;
  unread?: number;
  assignedToMe?: boolean;
  status: 'active' | 'waiting' | 'resolved';
  avatar: string;
  color: string;
};

type Message = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
};

type ChatMetadata = {
  tags: string[];
  attributes: string[];
  notes: string[];
};



export default function ChatsPage() {
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [metadataModal, setMetadataModal] = useState<'tags' | 'attributes' | 'notes' | null>(null);
  const [expandedMetadata, setExpandedMetadata] = useState<'tags' | 'attributes' | 'notes' | null>(null);
  const [chatMetadata, setChatMetadata] = useState<Record<string, ChatMetadata>>({});
  const [draftTag, setDraftTag] = useState('');
  const [draftAttribute, setDraftAttribute] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [attributeName, setAttributeName] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [selectedTagOptions, setSelectedTagOptions] = useState<string[]>([]);
  const [assignee, setAssignee] = useState('You');
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOptedIn, setIsOptedIn] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [requiresTemplateMap, setRequiresTemplateMap] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [availableTags, setAvailableTags] = useState<{name: string, color: string}[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
  const [availableQuickReplies, setAvailableQuickReplies] = useState<{id: string; title: string; message: string; shortcut: string | null}[]>([]);

  const [showQuickReplyMenu, setShowQuickReplyMenu] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');

  const fetchConversationsList = async () => {
    try {
      const res = await fetch("/api/chats/conversations");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.contacts?.name || c.contacts?.whatsapp_number || "Unknown",
          phone: c.contacts?.whatsapp_number || "",
          preview: "...",
          time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString() : "",
          status: c.status === "open" ? "active" : c.status === "snoozed" ? "waiting" : "resolved",
          avatar: (c.contacts?.name || c.contacts?.whatsapp_number || "?").substring(0, 2).toUpperCase(),
          color: "bg-[#e0f2fe] text-[#0369a1]"
        }));
        setConversations(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [tagsRes, attrsRes, qrRes] = await Promise.all([
          fetch("/api/tags"),
          fetch("/api/attribute-definitions"),
          fetch("/api/quick-replies")
        ]);
        if (tagsRes.ok) setAvailableTags(await tagsRes.json());
        if (attrsRes.ok) {
          const attrs = await attrsRes.json();
          setAvailableAttributes(attrs.map((a: any) => a.key_name));
        }
        if (qrRes.ok) setAvailableQuickReplies(await qrRes.json());
        
        await fetchConversationsList();
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/conversations/${selectedId}/messages`);
        if (res.ok) {
          const msgs = await res.json();
          const mappedMsgs = msgs.map((m: any) => ({
            id: m.id,
            from: m.direction === "inbound" ? "them" : "me",
            text: m.content.text || "",
            time: new Date(m.created_at).toLocaleTimeString(),
            status: m.status
          }));
          setThreads(prev => ({ ...prev, [selectedId]: mappedMsgs }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [selectedId]);

  const selectedMetadata = selectedId ? chatMetadata[selectedId] ?? { tags: [], attributes: [], notes: [] } : { tags: [], attributes: [], notes: [] };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 1800);
  };

  const handleManageLeads = () => {
    setActiveTab('mine');
    setQuery('');
    showToast('Lead queue opened');
  };

  const handleFilterToggle = () => {
    setQuery((current) => (current ? '' : 'active'));
    showToast('Quick filter updated');
  };

  const cycleConversationStatus = () => {
    if (!selectedId) return;

    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== selectedId) return conversation;

        const nextStatus = conversation.status === 'active' ? 'waiting' : conversation.status === 'waiting' ? 'resolved' : 'active';
        return { ...conversation, status: nextStatus };
      }),
    );
  };

  const saveTags = () => {
    const newTag = draftTag.trim();
    if (!selectedId) return;
    setChatMetadata((previous) => ({
      ...previous,
      [selectedId]: {
        ...selectedMetadata,
        tags: [...new Set([...selectedMetadata.tags, ...selectedTagOptions, ...(newTag ? [newTag] : [])])],
      },
    }));
    setDraftTag('');
    setSelectedTagOptions([]);
    setMetadataModal(null);
    showToast('Tags saved');
  };

  const saveAttribute = () => {
    const name = attributeName.trim();
    const value = draftAttribute.trim();
    if (!name || !value) return;

    if (!selectedId) return;
    setChatMetadata((previous) => ({
      ...previous,
      [selectedId]: { ...selectedMetadata, attributes: [...selectedMetadata.attributes, `${name}: ${value}`] },
    }));
    setAttributeName('');
    setDraftAttribute('');
    setMetadataModal(null);
    showToast('Attribute saved');
  };

  const saveNote = () => {
    const note = draftNote.trim();
    if (!note) return;

    const followup = followupDate || followupTime ? ` (${followupDate || 'No date'}${followupTime ? `, ${followupTime}` : ''})` : '';
    if (!selectedId) return;
    setChatMetadata((previous) => ({
      ...previous,
      [selectedId]: { ...selectedMetadata, notes: [...selectedMetadata.notes, `${note}${followup}`] },
    }));
    setDraftNote('');
    setFollowupDate('');
    setFollowupTime('');
    setMetadataModal(null);
    showToast('Note added');
  };

  const filteredConversations = useMemo(() => {
    let result = conversations;

    if (activeTab === 'active') {
      result = result.filter((item) => item.status === 'active');
    }

    if (activeTab === 'mine') {
      result = result.filter((item) => item.assignedToMe);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((item) => `${item.name} ${item.phone}`.toLowerCase().includes(q));
    }

    return result;
  }, [activeTab, conversations, query]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const addMessage = async (text: string) => {
    if (!selectedId || !text.trim()) return;

    try {
      const res = await fetch(`/api/chats/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      
      if (res.ok) {
        const msg = await res.json();
        const mappedMsg: Message = {
          id: msg.id,
          from: msg.direction === 'inbound' ? 'them' : 'me',
          text: msg.content.text || '',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          status: msg.status as any
        };
        
        setThreads((previous) => ({
          ...previous,
          [selectedId]: [...(previous[selectedId] ?? []), mappedMsg],
        }));
      } else {
        showToast("Failed to send message");
      }
    } catch (err) {
      showToast("Error sending message");
    }
  };

  const handleSendMessage = () => {
    addMessage(messageInput);
    setMessageInput('');
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedId) return;

    const attachmentText = `Attachment: ${file.name}`;
    addMessage(attachmentText);
    event.target.value = '';
  };

  const handleEmojiInsert = () => {
    setMessageInput((current) => `${current} 😊`);
  };

  const handleMoreAction = (action: 'copy' | 'markResolved' | 'clearNotes' | 'archive') => {
    if (action === 'markResolved') {
      cycleConversationStatus();
      showToast('Chat marked resolved');
    }

    if (action === 'copy') {
      showToast('Contact details copied');
    }

    if (action === 'clearNotes') {
      if (selectedId) {
        setChatMetadata((previous) => ({
          ...previous,
          [selectedId]: { ...selectedMetadata, notes: [] },
        }));
      }
      showToast('Notes cleared');
    }

    if (action === 'archive') {
      setConversations((previous) => previous.filter((conversation) => conversation.id !== selectedId));
      setSelectedId(null);
      showToast('Chat archived');
    }

    setShowActionMenu(false);
  };

  return (
    <div className="h-full">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-[60] rounded-[10px] border border-border bg-foreground px-3 py-2 text-[12px] font-medium text-background shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <div className="flex h-[calc(100vh-150px)] min-h-[620px] overflow-hidden rounded-xl border border-border bg-card">
        <aside className="relative flex w-[32%] min-w-[290px] max-w-[420px] flex-col border-r border-border bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-foreground">Chats</h2>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or number" className="h-8 flex-1 border-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <button type="button" onClick={handleFilterToggle} aria-label="Filter chats" className="flex h-8 w-8 items-center justify-center border border-border bg-muted text-muted-foreground">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[13px] font-medium text-muted-foreground">{filteredConversations.length} Chats</div>
          </div>

          <div className="mb-4 flex w-full items-center rounded-[12px] border border-border bg-background p-1">
            {(['all', 'active', 'mine'] as ChatTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 rounded-[8px] px-3 py-2 text-[13px] font-medium transition',
                  activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                ].join(' ')}
              >
                {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'My Chats'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No chats match the current filter.</div>
            ) : (
              filteredConversations.map((conversation) => {
                const selected = selectedId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(conversation.id);
                      setExpandedMetadata(null);
                    }}
                    className={[
                      'flex w-full items-center gap-3 border-b border-border p-3 text-left transition',
                      selected ? 'bg-primary/10' : 'bg-transparent hover:bg-muted/50',
                    ].join(' ')}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${conversation.color}`}>
                      {conversation.avatar}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="truncate text-[13px] font-semibold text-foreground">{conversation.name}</p>
                        <span className="text-[11px] text-muted-foreground">{conversation.time}</span>
                      </div>

                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="truncate text-[11px] text-muted-foreground">{conversation.phone}</p>
                        {conversation.unread ? <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">{conversation.unread}</span> : null}
                      </div>

                      <p className="truncate text-[12px] text-muted-foreground">{conversation.preview}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            aria-label="Start new chat"
            className="absolute bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(75,94,231,0.35)] hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </button>
        </aside>

        <main className="flex min-w-0 flex-1 bg-background">
          {!selectedConversation ? (
            <div className="flex h-full flex-1 items-center justify-center p-8">
              <div className="flex w-[420px] max-w-[85%] flex-col items-center rounded-xl border border-border bg-card px-7 py-8 lg:w-[440px]">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquarePlus className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-center text-[18px] font-semibold text-foreground">Your conversations live here</h3>
                <p className="mb-6 max-w-[300px] text-center text-[13px] leading-6 text-muted-foreground">Pick a conversation from the list to pick up where you left off, or start a new one to reach a customer directly.</p>
                <button type="button" onClick={() => setShowNewChat(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Start New Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-1">
              <section className="flex-1 min-w-0 border-r border-border bg-card">
                <header className="flex items-center justify-between border-b border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${selectedConversation.color}`}>
                      {selectedConversation.avatar}
                    </div>
                    <div className="text-[13px] font-semibold text-foreground">{selectedConversation.name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={cycleConversationStatus} className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-emerald-600">
                      {selectedConversation.status === 'resolved' ? 'Resolved' : selectedConversation.status === 'waiting' ? 'Waiting' : 'Active'}
                    </button>
                    <div className="relative">
                      <button type="button" onClick={() => setShowAssigneeMenu((current) => !current)} className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {assignee}
                      </button>
                      {showAssigneeMenu ? (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-32 rounded-lg border border-border bg-card p-2 text-left shadow-lg">
                          {['You', 'Sales', 'Support', 'Marketing'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setAssignee(option);
                                setShowAssigneeMenu(false);
                                showToast(`Assigned to ${option}`);
                              }}
                              className="block w-full rounded-[6px] px-2 py-1 text-left text-[11px] text-foreground hover:bg-muted"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </header>

                <div className="flex h-[calc(100%-72px)] flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto bg-[#f4f5f7] px-4 py-5">
                    <div className="space-y-4">
                      {(selectedId && threads[selectedId] && threads[selectedId].length > 0) ? (
                        threads[selectedId].map((msg: Message) => (
                          <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[78%] rounded-[8px] p-3 text-[12px] leading-6 ${msg.from === 'me' ? 'bg-[#4b5ee7] text-white' : 'border border-[#dfe3ea] bg-white text-[#2a2f3d]'}`}>
                              <div className={msg.from === 'me' ? 'font-medium' : 'text-[#374151]'}>{msg.text}</div>
                              <div className={`mt-2 flex items-center gap-1 text-[10px] ${msg.from === 'me' ? 'justify-end text-blue-100' : 'text-right text-[#697181]'}`}>
                                <span>{msg.time}</span>
                                {msg.from === 'me' && <CheckCheck className="h-3 w-3" />}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center pt-20 text-center">
                          <MessageSquare className="mb-4 h-10 w-10 text-muted-foreground/30" />
                          <h4 className="text-[14px] font-semibold text-foreground">No messages yet</h4>
                          <p className="mt-1 text-[12px] text-muted-foreground">Send the first message to start the conversation.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border bg-card p-3">
                    {selectedConversation.status === 'waiting' && !selectedConversation.assignedToMe && (
                      <div className="mb-3 rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          New Conversation
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="text-[12px] text-emerald-700 dark:text-emerald-300">New conversation waiting for response. Click to join.</p>
                          <button type="button" onClick={async () => {
                            if (!selectedId) return;
                            try {
                              const res = await fetch(`/api/chats/conversations/${selectedId}/assign`, { method: 'POST' });
                              if (res.ok) {
                                setConversations(prev => prev.map(c => 
                                  c.id === selectedId ? { ...c, status: 'active', assignedToMe: true } : c
                                ));
                                showToast('New chat assigned to you');
                              } else {
                                throw new Error('Failed');
                              }
                            } catch (e) {
                              showToast('Failed to claim chat');
                            }
                          }} className="rounded-[8px] bg-emerald-500 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-600 transition">
                            Take New Chat
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 relative">
                      {showQuickReplyMenu && availableQuickReplies.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[400px] rounded-[8px] border border-border bg-card p-2 shadow-xl z-50">
                          <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase">Quick Replies</p>
                          <div className="max-h-[200px] overflow-y-auto">
                            {availableQuickReplies
                              .filter(qr => (qr.shortcut || '').toLowerCase().includes(quickReplyFilter) || qr.title.toLowerCase().includes(quickReplyFilter))
                              .map(qr => (
                                <button
                                  key={qr.id}
                                  type="button"
                                  className="w-full flex items-center justify-between text-left px-3 py-2 text-[12px] hover:bg-muted rounded-[6px]"
                                  onClick={() => {
                                    const lastSlashIdx = messageInput.lastIndexOf('/');
                                    const beforeSlash = messageInput.substring(0, lastSlashIdx);
                                    setMessageInput(beforeSlash + qr.message);
                                    setShowQuickReplyMenu(false);
                                  }}
                                >
                                  <div>
                                    <strong className="block text-foreground">{qr.title}</strong>
                                    <span className="block text-[11px] text-muted-foreground truncate max-w-[250px]">{qr.message}</span>
                                  </div>
                                  {qr.shortcut && <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">/{qr.shortcut}</span>}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      <button type="button" onClick={handleAttachment} aria-label="Attach file" className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted rounded-md">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                      <button type="button" onClick={handleEmojiInsert} aria-label="Emoji" className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted rounded-md">
                        <Smile className="h-4 w-4" />
                      </button>
                      {selectedId && requiresTemplateMap[selectedId] ? (
                        <button type="button" onClick={() => window.location.href = '/dashboard/templates'} className="h-9 flex-1 border-0 bg-transparent px-2 text-[13px] text-left text-muted-foreground focus:outline-none">
                          Conversation expired. Click to send a template.
                        </button>
                      ) : (
                        <input value={messageInput} onChange={(event) => {
                          const val = event.target.value;
                          setMessageInput(val);
                          const lastSlashIdx = val.lastIndexOf('/');
                          if (lastSlashIdx !== -1) {
                            const afterSlash = val.substring(lastSlashIdx + 1);
                            if (!afterSlash.includes(' ')) {
                              setShowQuickReplyMenu(true);
                              setQuickReplyFilter(afterSlash.toLowerCase());
                              return;
                            }
                          }
                          setShowQuickReplyMenu(false);
                        }} onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleSendMessage();
                          } else if (event.key === 'Escape') {
                            setShowQuickReplyMenu(false);
                          }
                        }} placeholder="Type a message (type / for quick replies)" className="h-9 flex-1 border-0 bg-transparent px-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                      )}
                      <button type="button" onClick={handleSendMessage} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90">
                        <Send className="h-4 w-4" /> Send
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="w-[30%] min-w-[280px] max-w-[360px] overflow-y-auto border-l border-border bg-muted/30 p-4">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-[18px] font-semibold text-primary">
                      {selectedConversation.avatar}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{selectedConversation.name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{selectedConversation.phone}</div>
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 border-b border-border pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptedIn((current) => !current);
                        showToast(isOptedIn ? 'Opted in switched off' : 'Opted in switched on');
                      }}
                      className="flex min-h-[68px] flex-col items-start justify-between rounded-[8px] border border-border bg-card hover:bg-muted px-3 py-2 text-left transition"
                    >
                      <span className="text-[10px] font-semibold text-muted-foreground">Opt-in Status <Info className="ml-1 inline h-3 w-3" /></span>
                      <span className="flex w-full items-center justify-between text-[13px] font-medium text-primary">Opted In <CyberToggle checked={isOptedIn} onChange={(checked) => { setIsOptedIn(checked); showToast(checked ? 'Opted in switched on' : 'Opted in switched off'); }} /></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBlocked((current) => !current);
                        showToast(isBlocked ? 'Unblocked the contact' : 'Blocked the contact');
                      }}
                      className="flex min-h-[68px] flex-col items-start justify-between rounded-[8px] border border-border bg-card hover:bg-muted px-3 py-2 text-left transition"
                    >
                      <span className="text-[10px] font-semibold text-muted-foreground">Block Status <Info className="ml-1 inline h-3 w-3" /></span>
                      <span className="flex w-full items-center justify-between text-[13px] font-medium text-muted-foreground">{isBlocked ? 'Blocked' : 'Not Blocked'} <CyberToggle checked={isBlocked} onChange={(checked) => { setIsBlocked(checked); showToast(checked ? 'Blocked the contact' : 'Unblocked the contact'); }} /></span>
                    </button>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'tags' as const, label: 'Tags', entries: selectedMetadata.tags },
                    { key: 'attributes' as const, label: 'Attributes', entries: selectedMetadata.attributes },
                    { key: 'notes' as const, label: 'Notes & Followups', entries: selectedMetadata.notes },
                  ].map((item) => {
                    const canExpand = true;
                    const isExpanded = canExpand && expandedMetadata === item.key;

                    return (
                      <div key={item.key} className="overflow-hidden rounded-[8px] border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-3 py-3">
                          <button
                            type="button"
                            onClick={() => canExpand ? setExpandedMetadata(isExpanded ? null : item.key) : setMetadataModal(item.key)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:text-primary"
                          >
                            {item.key === 'tags' ? <Tag className="h-5 w-5 text-primary" /> : item.key === 'attributes' ? <ClipboardList className="h-5 w-5 text-primary" /> : <StickyNote className="h-5 w-5 text-primary" />}
                            <span className="block text-[13px] font-semibold text-foreground">{item.label} <Info className="ml-1 inline h-3 w-3 text-muted-foreground" /></span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMetadataModal(item.key)}
                            aria-label={`Add ${item.label}`}
                            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center text-[21px] leading-none text-primary hover:text-primary/80"
                          >
                            +
                          </button>
                          {canExpand ? (
                            <button type="button" onClick={() => setExpandedMetadata(isExpanded ? null : item.key)} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`} className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          ) : null}
                        </div>

                        {isExpanded ? (
                          <div className="bg-background px-3 py-3">
                            {item.entries.length ? (
                              <div className="space-y-2">
                                {item.entries.map((entry) => (
                                  <div key={entry} className="rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] text-foreground">
                                    {item.key === 'attributes' && entry.includes(':') ? (
                                      <><div className="mb-1 text-[11px] text-muted-foreground">{entry.split(':')[0]}</div><div className="text-[13px] text-foreground">{entry.split(':').slice(1).join(':').trim()}</div></>
                                    ) : entry}
                                  </div>
                                ))}
                                <button type="button" onClick={() => setMetadataModal(item.key)} className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary/10 hover:bg-primary/20 py-2 text-[12px] font-medium text-primary transition"><Plus className="h-4 w-4" /> Add {item.key === 'tags' ? 'Tag' : item.key === 'attributes' ? 'Attribute' : 'Note'}</button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center py-5 text-center">
                                {item.key === 'tags' ? <Tag className="mb-3 h-10 w-10 text-muted-foreground/30" /> : item.key === 'attributes' ? <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/30" /> : <StickyNote className="mb-3 h-10 w-10 text-muted-foreground/30" />}
                                <p className="text-[12px] text-muted-foreground">No {item.label.toLowerCase()} added yet</p>
                                <button type="button" onClick={() => setMetadataModal(item.key)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary/10 hover:bg-primary/20 py-2 text-[12px] font-medium text-primary transition"><Plus className="h-4 w-4" /> Add {item.key === 'tags' ? 'Tag' : item.key === 'attributes' ? 'Attribute' : 'Note'}</button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {showActionMenu ? (
                  <div className="mt-3 rounded-[10px] border border-border bg-card p-2 shadow-lg">
                    <button type="button" onClick={() => handleMoreAction('copy')} className="block w-full rounded-[6px] px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">Copy contact</button>
                    <button type="button" onClick={() => handleMoreAction('markResolved')} className="block w-full rounded-[6px] px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">Mark resolved</button>
                    <button type="button" onClick={() => handleMoreAction('clearNotes')} className="block w-full rounded-[6px] px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">Clear notes</button>
                    <button type="button" onClick={() => handleMoreAction('archive')} className="block w-full rounded-[6px] px-2 py-1.5 text-left text-[12px] text-destructive hover:bg-destructive/10">Archive chat</button>
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </main>
      </div>

      {metadataModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[530px] rounded-xl border border-border bg-card p-6 text-foreground shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[25px] font-semibold tracking-[-0.02em]">
                {metadataModal === 'notes' ? 'Add Note & Followup' : metadataModal === 'attributes' ? 'Add Attribute' : 'Add Tags'}
              </h2>
              <button type="button" onClick={() => setMetadataModal(null)} aria-label="Close dialog" className="text-[30px] font-light leading-none text-muted-foreground hover:text-foreground">×</button>
            </div>

            {metadataModal === 'notes' ? (
              <div>
                <label className="block text-[16px] font-semibold text-foreground">
                  Note Content *
                  <textarea
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.target.value)}
                    placeholder="Enter your note here..."
                    className="mt-3 h-[132px] w-full resize-y rounded-[10px] border border-border bg-background p-4 text-[16px] font-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </label>
                <div className="my-5 border-t border-border" />
                <div className="mb-4 flex items-center gap-2 text-[17px] font-medium text-foreground">
                  <span className="text-[22px] text-primary">□</span>
                  Followup <span className="font-normal text-muted-foreground">(Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-[14px] font-medium text-muted-foreground">
                    Date
                    <input type="date" value={followupDate} onChange={(event) => setFollowupDate(event.target.value)} className="mt-1.5 h-12 w-full rounded-[8px] border border-border bg-background px-3 text-[15px] outline-none focus:border-primary" />
                  </label>
                  <label className="text-[14px] font-medium text-muted-foreground">
                    Time
                    <input type="time" value={followupTime} onChange={(event) => setFollowupTime(event.target.value)} className="mt-1.5 h-12 w-full rounded-[8px] border border-border bg-background px-3 text-[15px] outline-none focus:border-primary" />
                  </label>
                </div>
                <div className="my-6 border-t border-border" />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setMetadataModal(null)} className="h-12 rounded-[10px] border border-border bg-background hover:bg-muted px-5 text-[16px] font-medium text-foreground">Cancel</button>
                  <button type="button" onClick={saveNote} disabled={!draftNote.trim()} className="h-12 rounded-[10px] bg-primary px-6 text-[16px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Add</button>
                </div>
              </div>
            ) : null}

            {metadataModal === 'attributes' ? (
              <div>
                <label className="block text-[16px] font-semibold text-foreground">
                  Name
                  <input value={attributeName} onChange={(event) => setAttributeName(event.target.value)} list="chat-attrs" placeholder="Search or create attribute" className="mt-3 h-14 w-full rounded-[10px] border border-border bg-background px-5 text-[16px] font-normal outline-none placeholder:text-muted-foreground focus:border-primary" />
                  <datalist id="chat-attrs">
                    {availableAttributes.map(a => <option key={a} value={a} />)}
                  </datalist>
                </label>
                <label className="mt-7 block text-[16px] font-semibold text-foreground">
                  Value
                  <input value={draftAttribute} onChange={(event) => setDraftAttribute(event.target.value)} placeholder="Enter attribute value" className="mt-3 h-14 w-full rounded-[10px] border border-border bg-background px-5 text-[16px] font-normal outline-none placeholder:text-muted-foreground focus:border-primary" />
                </label>
                <div className="my-7 border-t border-border" />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setMetadataModal(null)} className="h-12 rounded-[10px] border border-border bg-background hover:bg-muted px-5 text-[16px] font-medium text-foreground">Cancel</button>
                  <button type="button" onClick={saveAttribute} disabled={!attributeName.trim() || !draftAttribute.trim()} className="h-12 rounded-[10px] bg-primary px-6 text-[16px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Save</button>
                </div>
              </div>
            ) : null}

            {metadataModal === 'tags' ? (
              <div>
                <label className="block text-[16px] font-semibold text-foreground">
                  Search or create tags
                  <input value={draftTag} onChange={(event) => setDraftTag(event.target.value)} placeholder="Type tag name" className="mt-3 h-14 w-full rounded-[10px] border border-border bg-background px-5 text-[16px] font-normal outline-none placeholder:text-muted-foreground focus:border-primary" />
                </label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-[10px] border border-border bg-card p-3">
                  {availableTags.map((tagObj) => {
                    const option = tagObj.name;
                    const checked = selectedTagOptions.includes(option);
                    return (
                      <label key={option} className="flex cursor-pointer items-center gap-3 px-2 py-2.5 text-[16px] text-foreground hover:bg-muted">
                        <input type="checkbox" checked={checked} onChange={() => setSelectedTagOptions((previous) => checked ? previous.filter((tag) => tag !== option) : [...previous, option])} className="h-5 w-5 accent-primary" />
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tagObj.color || '#1d4ed8' }} />
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setMetadataModal(null)} className="h-12 rounded-[10px] border border-border bg-background hover:bg-muted px-5 text-[16px] font-medium text-foreground">Cancel</button>
                  <button type="button" onClick={saveTags} disabled={!draftTag.trim() && selectedTagOptions.length === 0} className="h-12 rounded-[10px] bg-primary px-6 text-[16px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Save</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showNewChat && (
        <StartChatModal 
          onClose={() => setShowNewChat(false)} 
          onChatCreated={(conversationId, requiresTemplate) => {
            setShowNewChat(false);
            setRequiresTemplateMap(prev => ({ ...prev, [conversationId]: requiresTemplate }));
            setSelectedId(conversationId);
            // Re-fetch conversations to include the new one in the list
            fetchConversationsList();
          }} 
        />
      )}
    </div>
  );
}
