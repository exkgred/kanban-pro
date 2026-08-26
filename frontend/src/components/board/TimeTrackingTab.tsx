'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input } from '../ui';
import { Card, TimeLog } from '../../types';
import { apiClient } from '../../lib/api-client';
import { useBoardStore } from '../../stores/board-store';
import { useAuthStore } from '../../stores/auth-store';
import toast from 'react-hot-toast';

interface TimeTrackingTabProps {
  card: Card;
  boardId: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatHms(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TimeTrackingTab({ card, boardId }: TimeTrackingTabProps) {
  const user = useAuthStore((s) => s.user);
  const handleCardUpdated = useBoardStore((s) => s.handleCardUpdated);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadLogs = async () => {
    try {
      const res = await apiClient.get(`/boards/${boardId}/cards/${card.id}/timelogs`);
      const items = Array.isArray((res as { data: TimeLog[] }).data)
        ? (res as { data: TimeLog[] }).data
        : [];
      setLogs((prev) => {
        const remoteIds = new Set(items.map((log) => log.id));
        const localActive = prev.filter((log) => !log.endTime && log.id && !remoteIds.has(log.id));
        return localActive.length > 0 ? [...localActive, ...items] : items;
      });
    } catch {
      toast.error('Erro ao carregar apontamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, boardId]);

  const myActive = useMemo(
    () =>
      logs.find(
        (log) =>
          Boolean(log) &&
          !log.endTime &&
          (log.userId === user?.id || log.user?.id === user?.id),
      ) ?? null,
    [logs, user?.id],
  );

  useEffect(() => {
    if (!myActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [myActive]);

  const elapsedSeconds = myActive
    ? Math.floor((now - new Date(myActive.startTime).getTime()) / 1000)
    : 0;

  const applyExecutedHours = (executedHours: number, extra?: Partial<Card>) => {
    handleCardUpdated({
      ...card,
      executedHours,
      ...extra,
    });
  };

  const handlePlay = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post(
        `/boards/${boardId}/cards/${card.id}/timelogs/start`,
        { description: note || undefined },
      );
      const started = (res as { data: TimeLog }).data;
      setLogs((prev) => [started, ...prev]);
      handleCardUpdated({
        ...card,
        activeTimer: {
          id: started.id,
          userId: started.userId,
          startTime: started.startTime,
          description: started.description,
        },
      });
      toast.success('Atividade iniciada');
    } catch {
      toast.error('Não foi possível iniciar o cronômetro');
    } finally {
      setBusy(false);
    }
  };

  const handlePause = async () => {
    if (!myActive) return;
    setBusy(true);
    try {
      const res = await apiClient.post(
        `/boards/${boardId}/cards/${card.id}/timelogs/${myActive.id}/stop`,
      );
      const payload = (res as { data: { timeLog: TimeLog; executedHours: number } }).data;
      setLogs((prev) =>
        prev.map((log) => (log.id === payload.timeLog.id ? payload.timeLog : log)),
      );
      applyExecutedHours(payload.executedHours, { activeTimer: null });
      toast.success('Horas registradas');
    } catch {
      toast.error('Não foi possível pausar o cronômetro');
    } finally {
      setBusy(false);
    }
  };

  const handleManual = async () => {
    const hours = Number(manualHours || 0) + Number(manualMinutes || 0) / 60;
    if (hours <= 0) {
      toast.error('Informe horas ou minutos');
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient.post(
        `/boards/${boardId}/cards/${card.id}/timelogs/manual`,
        { hours, description: note || undefined },
      );
      const payload = (res as { data: { timeLog: TimeLog; executedHours: number } }).data;
      setLogs((prev) => [payload.timeLog, ...prev]);
      applyExecutedHours(payload.executedHours);
      setManualHours('');
      setManualMinutes('');
      toast.success('Apontamento adicionado');
    } catch {
      toast.error('Erro ao apontar horas');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Excluir este apontamento?')) return;
    try {
      const res = await apiClient.delete(
        `/boards/${boardId}/cards/${card.id}/timelogs/${logId}`,
      );
      const payload = (res as { data: { executedHours: number } }).data;
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      applyExecutedHours(payload.executedHours, logId === myActive?.id ? { activeTimer: null } : undefined);
    } catch {
      toast.error('Erro ao excluir apontamento');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Cronômetro</p>
        <p data-cy="timer-display" className="text-4xl font-mono font-semibold text-slate-900 tabular-nums">
          {formatHms(elapsedSeconds)}
        </p>
        <p data-cy="executed-summary" className="text-xs text-slate-500 mt-1">
          Executado: {Number(card.executedHours ?? 0).toFixed(2)}h / planejado:{' '}
          {Number(card.estimatedHours ?? 0).toFixed(2)}h
        </p>
        <div className="mt-3">
          <Input
            data-cy="timer-note"
            placeholder="O que você está fazendo?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="mt-3">
          {myActive ? (
            <Button data-cy="timer-pause" onClick={handlePause} isLoading={busy} variant="secondary">
              ⏸ Pausar & Registrar
            </Button>
          ) : (
            <Button data-cy="timer-play" onClick={handlePlay} isLoading={busy} disabled={loading}>
              ▶ Iniciar Atividade
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-800 mb-3">Apontamento manual</p>
        <div className="flex items-end gap-2">
          <Input
            data-cy="manual-hours"
            label="Horas"
            type="number"
            min={0}
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            placeholder="2"
          />
          <Input
            data-cy="manual-minutes"
            label="Minutos"
            type="number"
            min={0}
            max={59}
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            placeholder="30"
          />
          <Button data-cy="manual-submit" onClick={handleManual} isLoading={busy} disabled={loading} size="sm" className="mb-0.5">
            Lançar
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800 mb-2">Histórico</p>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum apontamento ainda.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table data-cy="timelog-history" className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Autor</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Duração</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{log.user?.name ?? 'Você'}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(log.startTime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {log.endTime ? formatDuration(log.durationSeconds) : (
                        <span className="text-emerald-600 font-medium">em andamento</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{log.description ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(log.id)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
