import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { sbSelect, sbInsert, getBusinessId, rupees } from '@/lib/supabaseRest';
const C={bg:'#0f172a',card:'#1e293b',border:'#334155',text:'#e2e8f0',muted:'#94a3b8',subtle:'#64748b',primary:'#49dfbd',error:'#ef4444'};
const REASONS=[{key:'customer_refused',label:'Customer ne inkar kiya'},{key:'wrong_number',label:'Ghalat number'},{key:'address_issue',label:'Address nahi mila'},{key:'customer_not_available',label:'Customer mojood nahi'},{key:'fake_order',label:'Fake order'},{key:'damaged',label:'Maal damage'},{key:'wrong_item',label:'Ghalat item'},{key:'quality_issue',label:'Quality complaint'},{key:'changed_mind',label:'Iraada badal gaya'},{key:'other',label:'Aur koi wajah'}];
interface Ret{id:number;reason:string;loss_amount:number;restocked:boolean;return_date:string;notes:string|null;}
export default function ReturnsScreen(){
  const [list,setList]=useState<Ret[]>([]);const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [showAdd,setShowAdd]=useState(false);const [saving,setSaving]=useState(false);
  const [reason,setReason]=useState('customer_refused');const [loss,setLoss]=useState('');const [notes,setNotes]=useState('');const [restocked,setRestocked]=useState(true);
  const load=async()=>{const bid=await getBusinessId();setList(await sbSelect<Ret>(`returns?business_id=eq.${bid}&order=created_at.desc&limit=100`));setLoading(false);setRefreshing(false);};
  useEffect(()=>{void load();},[]);
  const totalLoss=list.reduce((s,r)=>s+Number(r.loss_amount||0),0);
  const reasonLabel=(k:string)=>REASONS.find(r=>r.key===k)?.label||k;
  const save=async()=>{setSaving(true);const bid=await getBusinessId();await sbInsert('returns',{business_id:bid,reason,loss_amount:Number(loss)||0,restocked,notes:notes.trim()||null});setSaving(false);setShowAdd(false);setLoss('');setNotes('');setReason('customer_refused');setRestocked(true);void load();};
  return(
    <View style={s.container}>
      <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>←</Text></TouchableOpacity><Text style={s.h1}>Returns / RTO</Text><TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnText}>+ Return</Text></TouchableOpacity></View>
      <View style={s.totalCard}><Text style={s.totalLabel}>Total RTO Loss</Text><Text style={s.totalValue}>{rupees(totalLoss)}</Text><Text style={s.totalSub}>{list.length} returns</Text></View>
      {loading?<ActivityIndicator color={C.primary} style={{marginTop:40}}/>:(
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load();}} tintColor={C.primary}/>} contentContainerStyle={{paddingBottom:40}}>
          {list.map(r=>(
            <View key={r.id} style={s.row}>
              <View style={{flex:1}}><Text style={s.name}>{reasonLabel(r.reason)}</Text><Text style={s.meta}>{r.return_date} · {r.restocked?'✓ Stock wapas':'✗ Stock nahi'}{r.notes?' · '+r.notes:''}</Text></View>
              <Text style={s.loss}>-{rupees(r.loss_amount)}</Text>
            </View>
          ))}
          {list.length===0&&<Text style={s.empty}>Koi return nahi! 🎉</Text>}
        </ScrollView>
      )}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={()=>setShowAdd(false)}>
        <View style={s.overlay}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center'}}><View style={s.modal}>
          <Text style={s.h2}>Naya Return</Text>
          <Text style={s.label}>Wajah</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:10}}>
            {REASONS.map(rr=><TouchableOpacity key={rr.key} style={[s.chip,reason===rr.key&&s.chipActive]} onPress={()=>setReason(rr.key)}><Text style={[s.chipText,reason===rr.key&&{color:C.bg}]}>{rr.label}</Text></TouchableOpacity>)}
          </View>
          <TextInput style={s.input} placeholder="Loss (Rs — courier waghaira)" placeholderTextColor={C.subtle} keyboardType="numeric" value={loss} onChangeText={setLoss}/>
          <TextInput style={s.input} placeholder="Notes (optional)" placeholderTextColor={C.subtle} value={notes} onChangeText={setNotes}/>
          <TouchableOpacity style={s.toggleRow} onPress={()=>setRestocked(!restocked)}>
            <Text style={{color:C.text,fontSize:13}}>Maal wapas stock mein?</Text>
            <Text style={{color:restocked?C.primary:C.error,fontWeight:'800'}}>{restocked?'✓ Haan':'✗ Nahi'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={save}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.saveBtnText}>✓ Save Return</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowAdd(false)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></ScrollView></View>
      </Modal>
    </View>
  );
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:C.bg,padding:16,paddingTop:56},headerRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},back:{color:C.muted,fontSize:22},h1:{fontSize:22,fontWeight:'800',color:C.text,flex:1},h2:{fontSize:18,fontWeight:'700',color:C.text,marginBottom:10},addBtn:{backgroundColor:C.primary,borderRadius:9,paddingHorizontal:12,paddingVertical:7},addBtnText:{color:C.bg,fontWeight:'800',fontSize:12},totalCard:{backgroundColor:C.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.error+'44'},totalLabel:{color:C.muted,fontSize:12},totalValue:{color:C.error,fontSize:26,fontWeight:'800',marginTop:2},totalSub:{color:C.subtle,fontSize:11,marginTop:2},row:{flexDirection:'row',backgroundColor:C.card,borderRadius:12,padding:14,marginBottom:8,alignItems:'center'},name:{color:C.text,fontWeight:'700',fontSize:13},meta:{color:C.subtle,fontSize:11,marginTop:2},loss:{color:C.error,fontWeight:'800',fontSize:14},empty:{color:C.subtle,textAlign:'center',padding:30},overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',padding:24},modal:{backgroundColor:C.bg,borderRadius:16,padding:20,borderWidth:1,borderColor:C.border},label:{color:C.muted,fontSize:12,marginBottom:6},chip:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:999,paddingHorizontal:10,paddingVertical:6},chipActive:{backgroundColor:C.primary,borderColor:C.primary},chipText:{color:C.muted,fontSize:10,fontWeight:'600'},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,padding:12,color:C.text,marginBottom:8},toggleRow:{flexDirection:'row',justifyContent:'space-between',backgroundColor:C.card,borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:C.border},saveBtn:{backgroundColor:C.primary,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:4},saveBtnText:{color:C.bg,fontWeight:'800'}});