
import { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, TextInput, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { fetchMonitoringComments, addMonitoringComment } from '@/lib/api';
import { Brand } from '@/constants/theme';

type Props = {
  monitoringId: string;
};

export function MonitoringComments({ monitoringId }: Props) {
  const { user, profile } = useAuth();
  const uid = user?.id || profile?.id;
  const toast = useToast();
  
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMonitoringComments(monitoringId);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monitoringId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body || !uid || sending) return;
    
    setSending(true);
    try {
      const newMsg = await addMonitoringComment(monitoringId, uid, body);
      setComments(prev => [...prev, newMsg]);
      setText('');
    } catch (err: any) {
      toast.show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" color={Brand.green} className="mt-2" />;

  return (
    <View className="mt-4 border-t border-gray-100 pt-3">
      <Text className="text-xs font-semibold text-gray-500 mb-2">
        Komentar ({comments.length})
      </Text>
      
      {comments.map(c => {
        const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        const isAdmin = profile?.role === 'admin';
        const name = profile?.nama_lengkap || 'Pengguna';
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        return (
          <View key={c.id} className="mb-2 flex-row gap-2">
            <View className={`size-6 items-center justify-center rounded-full ${isAdmin ? "bg-brand" : "bg-gray-200"}`}>
              <Text className={`text-[9px] font-bold ${isAdmin ? "text-white" : "text-gray-500"}`}>{initials}</Text>
            </View>
            <View className="flex-1 rounded-xl rounded-tl-sm bg-gray-50 p-2 px-3">
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-gray-800">
                  {name}
                </Text>
                {isAdmin && (
                  <MaterialIcons name="verified" size={12} color={Brand.green} />
                )}
              </View>
              <Text className="text-sm text-gray-700">{c.body}</Text>
            </View>
          </View>
        );
      })}

      <View className="mt-2 flex-row items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tulis komentar..."
          className="flex-1 text-sm text-gray-800"
          multiline
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          className={`size-8 items-center justify-center rounded-full ${text.trim() ? "bg-brand" : "bg-gray-200"}`}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={14} color={text.trim() ? '#fff' : '#9ca3af'} />
          )}
        </Pressable>
      </View>
    </View>
  );
}





