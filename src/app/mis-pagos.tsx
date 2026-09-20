import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PagoCard } from '@/components/pagos/PagoCard';
import { Colors } from '@/constants/theme';
import { pagosService } from '@/services/pagos.service';
import { errorMessage } from '@/utils/dialog';
import type { Pago } from '@/types/pagos';

export default function MisPagosScreen() {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [pagos,setPagos]=useState<Pago[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{setPagos(await pagosService.misPagos())}catch(err){setError(errorMessage(err))}finally{setLoading(false)}},[]);
  useFocusEffect(useCallback(()=>{void load()},[load]));
  return <Screen title="Mis pagos" subtitle="Historial de cobros y comprobantes internos." refreshing={loading} onRefresh={load}>
    {!!error&&<Card style={{padding:16,gap:8}}><Text accessibilityRole="alert" style={{color:theme.danger}}>{error}</Text><Button title="Reintentar" onPress={load}/></Card>}
    {loading?<ActivityIndicator color={theme.primary}/>:!error&&<>{pagos.length===0&&<Text style={{color:theme.textSecondary}}>Aún no tienes pagos registrados.</Text>}{pagos.map((p)=><PagoCard key={p.id_pago} pago={p}/>)}</>}
  </Screen>;
}
