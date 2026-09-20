import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { pagosService } from '@/services/pagos.service';
import { errorMessage } from '@/utils/dialog';
import type { Pago } from '@/types/pagos';

export default function ComprobanteScreen(){
 const {id}=useLocalSearchParams<{id:string}>();const router=useRouter();const theme=Colors[useColorScheme()==='dark'?'dark':'light'];
 const [pago,setPago]=useState<Pago|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const load=useCallback(async()=>{if(!id)return;setLoading(true);setError('');try{setPago(await pagosService.comprobante(id))}catch(err){setError(errorMessage(err))}finally{setLoading(false)}},[id]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 const items=pago?.detalle.servicios??pago?.detalle.productos??[];
 return <Screen title="Comprobante interno" subtitle="Constancia de pago de Carwash Inmari." headerRight={<Button title="Volver" variant="outline" onPress={()=>router.back()}/>}>
  {loading?<ActivityIndicator color={theme.primary}/>:error?<Card style={{padding:18,gap:8}}><Text accessibilityRole="alert" style={{color:theme.danger}}>{error}</Text><Button title="Reintentar" onPress={load}/></Card>:pago&&<Card style={{padding:24,gap:12}}>
   <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:8}}><Text style={{color:theme.text,fontSize:22,fontWeight:'900'}}>{pago.comprobante_interno}</Text><Badge label={pago.estado} status={pago.estado==='pagado'?'completada':'cancelado'}/></View>
   <Text style={{color:theme.textSecondary}}>Emitido: {new Date(pago.fecha_pago).toLocaleString('es-PE',{timeZone:'America/Lima'})}</Text>
   <Text style={{color:theme.text,fontWeight:'700'}}>Cliente: {pago.detalle.cliente??pago.cliente}</Text>
   {pago.detalle.correo&&<Text style={{color:theme.textSecondary}}>{pago.detalle.correo}</Text>}
   {pago.detalle.placa&&<Text style={{color:theme.text}}>Vehículo: {pago.detalle.placa}</Text>}
   {items.map((item,index)=><View key={`${item.nombre}-${index}`} style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><Text style={{color:theme.text,flex:1}}>{item.cantidad} × {item.nombre}</Text><Text style={{color:theme.text}}>S/ {(Number(item.precio_unitario)*item.cantidad).toFixed(2)}</Text></View>)}
   <View style={{borderTopWidth:1,borderColor:theme.border,paddingTop:12}}><Text style={{color:theme.text,fontSize:24,fontWeight:'900'}}>Total: S/ {Number(pago.monto).toFixed(2)} {pago.moneda}</Text><Text style={{color:theme.textSecondary}}>Método: {pago.metodo.replaceAll('_',' ')}</Text>{pago.referencia_externa&&<Text style={{color:theme.textSecondary}}>Referencia: {pago.referencia_externa}</Text>}</View>
   {pago.fecha_reversion&&<Text style={{color:theme.danger}}>Reembolsado el {new Date(pago.fecha_reversion).toLocaleString('es-PE',{timeZone:'America/Lima'})}: {pago.motivo_reversion}</Text>}
   <Text style={{color:theme.textSecondary,fontSize:12}}>Comprobante interno. No constituye comprobante tributario.</Text>
  </Card>}
 </Screen>
}
