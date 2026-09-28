import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface AudioRecorderProps {
  onSendAudio: (base64Audio: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/ogg;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);

      // Inicia contador de tempo
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar seu microfone. Verifique as permissões do navegador.');
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleFinishAndSend = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSendAudio(base64String, recordingTime);
      };
      stopRecordingCleanup();
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const handleCancelRecording = () => {
    stopRecordingCleanup();
    onCancel();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-slate-900 border border-emerald-500/40 rounded-2xl px-4 py-2.5 animate-fadeIn">
      {/* Botão de Cancelar / Lixeira */}
      <button
        onClick={handleCancelRecording}
        className="p-2 rounded-full hover:bg-slate-800 text-red-400 transition-colors"
        title="Cancelar gravação"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Indicador de Gravando e Timer */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="text-sm font-semibold text-slate-200 tracking-wider">
          {formatTimer(recordingTime)}
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline ml-2">
          Gravando mensagem de voz...
        </span>
      </div>

      {/* Botão de Enviar Áudio */}
      <button
        onClick={handleFinishAndSend}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-95"
      >
        <Send className="w-4 h-4" />
        <span>Enviar Áudio</span>
      </button>
    </div>
  );
};
