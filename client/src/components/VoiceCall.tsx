import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPeerConnection, createAudioConstraints, formatCallDuration, isWebRTCSupported } from "@/utils/callUtils";

interface VoiceCallProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
  isIncoming?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  existingWs?: WebSocket | null;
  currentUserId?: number;
}

export default function VoiceCall({ 
  isOpen, 
  onClose, 
  targetUser, 
  isIncoming = false,
  onAccept,
  onDecline,
  existingWs,
  currentUserId
}: VoiceCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // WebSocket connection for call signaling
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen && !isIncoming) {
      initializeCall().catch(error => {
        console.error('Failed to initialize call:', error);
        toast({
          title: "Call Failed",
          description: "Unable to start the call. Please check your microphone permissions.",
          variant: "destructive",
        });
        onClose();
      });
    }

    return () => {
      cleanup();
    };
  }, [isOpen, isIncoming]);

  useEffect(() => {
    if (isConnected && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected]);

  const initializeWebSocket = () => {
    // Use existing WebSocket connection if available
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      wsRef.current = existingWs;
      setupWebSocketHandlers();
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected for voice call');
      if (currentUserId) {
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          userId: currentUserId
        }));
      }
      setupWebSocketHandlers();
    };
  };

  const setupWebSocketHandlers = () => {
    if (!wsRef.current) return;

    const originalOnMessage = wsRef.current.onmessage;
    
    wsRef.current.onmessage = async (event) => {
      // Call original handler first if it exists
      if (originalOnMessage && existingWs) {
        originalOnMessage.call(wsRef.current, event);
      }
      
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'call-offer':
            if (data.fromUserId !== targetUser.id) return;
            await handleCallOffer(data.offer);
            break;
          case 'call-answer':
            if (data.fromUserId !== targetUser.id) return;
            await handleCallAnswer(data.answer);
            break;
          case 'ice-candidate':
            if (data.fromUserId !== targetUser.id) return;
            await handleIceCandidate(data.candidate);
            break;
          case 'call-ended':
            if (data.fromUserId !== targetUser.id) return;
            handleCallEnded();
            break;
          case 'call-declined':
            if (data.fromUserId !== targetUser.id) return;
            toast({
              title: "Call Declined",
              description: `${targetUser.name} declined the call`,
              variant: "default",
            });
            handleCallEnded();
            break;
          case 'call-error':
            if (data.targetUserId !== targetUser.id) return;
            toast({
              title: "Call Failed",
              description: data.error || "Unable to connect to user",
              variant: "destructive",
            });
            handleCallEnded();
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to establish call connection",
        variant: "destructive",
      });
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      if (isConnected) {
        toast({
          title: "Connection Lost",
          description: "Call connection was lost",
          variant: "destructive",
        });
        handleCallEnded();
      }
    };
  };

  const initializeCall = async () => {
    try {
      if (!isWebRTCSupported()) {
        throw new Error('WebRTC is not supported in this browser');
      }
      
      setCallStatus('connecting');
      
      // Initialize WebSocket for signaling
      initializeWebSocket();
      
      // Get user media (audio only)
      const constraints = createAudioConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      localStreamRef.current = stream;
      
      // Create peer connection
      peerConnectionRef.current = createPeerConnection();

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            targetUserId: targetUser.id
          }));
        }
      };

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setIsConnected(true);
          setCallStatus('connected');
          toast({
            title: "Call Connected",
            description: "Voice call is now active",
            variant: "default",
          });
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          if (isConnected) {
            toast({
              title: "Call Disconnected",
              description: "The call connection was lost",
              variant: "destructive",
            });
          }
          handleCallEnded();
        }
      };

      // Handle ICE connection state changes
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        console.log('ICE connection state:', state);
        
        if (state === 'failed' || state === 'disconnected') {
          setTimeout(() => {
            if (peerConnectionRef.current?.iceConnectionState === 'failed') {
              handleCallEnded();
            }
          }, 5000); // Give it 5 seconds to reconnect
        }
      };

      // Create and send offer with audio-specific options
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      
      // Wait for WebSocket to be ready before sending
      const sendOffer = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'call-offer',
            offer: offer,
            targetUserId: targetUser.id
          }));
        } else {
          setTimeout(sendOffer, 100); // Retry after 100ms
        }
      };
      sendOffer();

      setCallStatus('calling');
      
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to access microphone. Please check your browser permissions.",
        variant: "destructive",
      });
      cleanup();
      onClose();
    }
  };

  const handleCallOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnectionRef.current) {
        // Initialize peer connection for incoming call
        peerConnectionRef.current = createPeerConnection();

        // Get user media with enhanced audio settings
        const constraints = createAudioConstraints();
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              targetUserId: targetUser.id
            }));
          }
        };

        // Add connection state handlers for incoming calls too
        peerConnectionRef.current.onconnectionstatechange = () => {
          const state = peerConnectionRef.current?.connectionState;
          console.log('Connection state (incoming):', state);
          
          if (state === 'connected') {
            setIsConnected(true);
            setCallStatus('connected');
          } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            if (isConnected) {
              toast({
                title: "Call Disconnected",
                description: "The call connection was lost",
                variant: "destructive",
              });
            }
            handleCallEnded();
          }
        };
      }

      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call-answer',
          answer: answer,
          targetUserId: targetUser.id
        }));
      }

      // Don't set connected immediately, wait for connection state change
      setCallStatus('connecting');
      
    } catch (error) {
      console.error('Error handling call offer:', error);
      toast({
        title: "Call Failed",
        description: "Unable to access microphone. Please check your browser permissions.",
        variant: "destructive",
      });
      cleanup();
      onClose();
    }
  };

  const handleCallAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        // Don't set connected immediately, wait for connection state change
        setCallStatus('connecting');
      }
    } catch (error) {
      console.error('Error handling call answer:', error);
      toast({
        title: "Call Failed",
        description: "Failed to establish connection",
        variant: "destructive",
      });
      handleCallEnded();
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleCallEnded = () => {
    cleanup();
    onClose();
  };

  const acceptCall = async () => {
    try {
      setCallStatus('connecting');
      
      if (!wsRef.current) {
        initializeWebSocket();
        // Wait for WebSocket to connect
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              resolve(void 0);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }
      
      onAccept?.();
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to establish connection. Please try again.",
        variant: "destructive",
      });
      cleanup();
      onClose();
    }
  };

  const declineCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call-declined',
        targetUserId: targetUser.id
      }));
    }
    onDecline?.();
    cleanup();
    onClose();
  };

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call-ended',
        targetUserId: targetUser.id
      }));
    }
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // This is correct - if currently muted, enable it
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn; // This is correct - if speaker is on, mute it
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Only close WebSocket if we created it (not using existing one)
    if (wsRef.current && !existingWs) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsConnected(false);
    setCallDuration(0);
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 glass-effect sparkle-border">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-600">
            {targetUser.profileImageUrl ? (
              <img 
                src={targetUser.profileImageUrl} 
                alt={targetUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {targetUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <CardTitle className="text-xl">{targetUser.name}</CardTitle>
          <p className="text-sm text-gray-500">
            {callStatus === 'incoming' && 'Incoming call...'}
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && `Connected • ${formatCallDuration(callDuration)}`}
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Audio elements */}
          <audio ref={localAudioRef} muted />
          <audio ref={remoteAudioRef} autoPlay />
          
          {/* Call controls */}
          <div className="flex justify-center space-x-4">
            {callStatus === 'incoming' ? (
              <>
                <Button
                  onClick={declineCall}
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-14 h-14"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  onClick={acceptCall}
                  className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600"
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </>
            ) : (
              <>
                {isConnected && (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? "destructive" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12"
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      onClick={toggleSpeaker}
                      variant={!isSpeakerOn ? "destructive" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12"
                    >
                      {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-14 h-14"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}