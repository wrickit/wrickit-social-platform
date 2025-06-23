import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export default function VoiceCall({ 
  isOpen, 
  onClose, 
  targetUser, 
  isIncoming = false,
  onAccept,
  onDecline 
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
      initializeCall();
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
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected for voice call');
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'call-offer':
          await handleCallOffer(data.offer);
          break;
        case 'call-answer':
          await handleCallAnswer(data.answer);
          break;
        case 'ice-candidate':
          await handleIceCandidate(data.candidate);
          break;
        case 'call-ended':
          handleCallEnded();
          break;
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
  };

  const initializeCall = async () => {
    try {
      setCallStatus('connecting');
      
      // Initialize WebSocket for signaling
      initializeWebSocket();
      
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

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
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            targetUserId: targetUser.id
          }));
        }
      };

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'call-offer',
          offer: offer,
          targetUserId: targetUser.id
        }));
      }

      setCallStatus('calling');
      
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to access microphone or establish connection",
        variant: "destructive",
      });
      onClose();
    }
  };

  const handleCallOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnectionRef.current) {
        // Initialize peer connection for incoming call
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          if (event.candidate && wsRef.current) {
            wsRef.current.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              targetUserId: targetUser.id
            }));
          }
        };
      }

      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'call-answer',
          answer: answer,
          targetUserId: targetUser.id
        }));
      }

      setIsConnected(true);
      setCallStatus('connected');
      
    } catch (error) {
      console.error('Error handling call offer:', error);
    }
  };

  const handleCallAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        setIsConnected(true);
        setCallStatus('connected');
      }
    } catch (error) {
      console.error('Error handling call answer:', error);
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
      initializeWebSocket();
      onAccept?.();
      setCallStatus('connecting');
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to accept the call",
        variant: "destructive",
      });
    }
  };

  const declineCall = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'call-ended',
        targetUserId: targetUser.id
      }));
    }
    onDecline?.();
    cleanup();
    onClose();
  };

  const endCall = () => {
    if (wsRef.current) {
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
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
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
    
    if (wsRef.current) {
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            {callStatus === 'connected' && `Connected • ${formatDuration(callDuration)}`}
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