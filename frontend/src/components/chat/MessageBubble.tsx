import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  CheckCheck, 
  FileText, 
  Download, 
  Lock, 
  Mic, 
  Volume2,
  Maximize2
} from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.media_duration || 0);
  const [showImageModal, setShowImageModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isOutbound = message.direction === 'outbound';
  const isInternalNote = message.is_internal_note || message.type === 'internal_note';

  // Controle de Áudio
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. Mensagem: Nota Interna
  if (isInternalNote) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl max-w-lg shadow-sm text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>Nota Interna</span>
              <span className="text-[10px] text-amber-400/80 font-normal">
                (Apenas atendentes leem - invisível no WhatsApp)
              </span>
            </div>
            <p className="text-amber-100 text-sm whitespace-pre-wrap">{message.content}</p>
            <div className="text-[10px] text-amber-400/70 text-right">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mensagens Normais (Entrada / Saída)
  return (
    <div className={`flex w-full my-1.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-md md:max-w-lg rounded-2xl px-4 py-2.5 shadow-md ${
          isOutbound
            ? 'bg-whatsapp-darkBubbleOut text-slate-100 rounded-tr-xs border border-emerald-800/40'
            : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60'
        }`}
      >
        {/* Tipo: Áudio Nativo (PTT) */}
        {message.type === 'audio' && (
          <div className="space-y-2 min-w-[240px] sm:min-w-[280px]">
            <audio
              ref={audioRef}
              src={message.media_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayAudio}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 shadow-md"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Fake Waveform animada */}
              <div className="flex-1 flex items-center gap-0.5 h-7">
                {[12, 18, 8, 22, 14, 26, 16, 20, 10, 24, 18, 12, 22, 14, 20, 8, 16, 24, 12, 18].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${
                      isPlaying && i % 3 === 0
                        ? 'bg-emerald-300 wave-bar'
                        : i / 20 <= (duration ? currentTime / duration : 0)
                        ? 'bg-emerald-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>

              {/* Botão de Velocidade */}
              <button
                onClick={toggleSpeed}
                className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-700/70 hover:bg-slate-700 text-emerald-300 border border-slate-600"
              >
                {playbackSpeed}x
              </button>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                {isPlaying ? formatAudioTime(currentTime) : formatAudioTime(duration || 0)}
              </span>
              <span>{isOutbound ? 'Áudio gravado' : 'Áudio do cliente'}</span>
            </div>
          </div>
        )}

        {/* Tipo: Imagem */}
        {message.type === 'image' && message.media_url && (
          <div className="space-y-1.5">
            <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-slate-950/40">
              <img
                src={message.media_url}
                alt="Imagem enviada"
                className="max-h-72 w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-102"
                onClick={() => setShowImageModal(true)}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-slate-900/80 p-2 rounded-full text-white">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>
            {message.content && message.content !== '📷 Foto' && (
              <p className="text-sm text-slate-200 pt-1">{message.content}</p>
            )}
          </div>
        )}

        {/* Tipo: Documento / PDF */}
        {message.type === 'document' && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 min-w-[220px]">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">
                {message.media_filename || 'documento.pdf'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase">Documento</p>
            </div>
            {message.media_url && (
              <a
                href={message.media_url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Tipo: Texto Padrão */}
        {message.type === 'text' && (
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
            {message.content}
          </p>
        )}

        {/* Rodapé da Bolha: Horário & Status de Entrega */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 select-none">
          <span>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {isOutbound && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Modal Lightbox de Imagem */}
      {showImageModal && message.media_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={message.media_url}
            alt="Preview"
            className="max-w-4xl max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
