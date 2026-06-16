import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,StyleSheet,Alert,ActivityIndicator,Modal,RefreshControl} from 'react-native';
import {router} from 'expo-router';
import {sbSelect,sbInsert,getBusinessId,rupees} from '@/lib/supabaseRest';
const C={bg:'#0f172a',card:'#1e293b',border:'#334155',text:'#e2e8f0',muted:'#94a3b8',subtle:'#64748b',primary:'#49dfbd',warn:'#fbbf24'};
interface K{id:number;name:string;phone:string|null;wage_type:'monthly'|'daily'|'per_piece';wage_amount:number;}
const WL={monthly:'Mahana',daily:'Dehari',per_piece:'Per Piece'};
export default function KarigarScreen(){
  const [list,setList]=useState<K[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [showPay,setShowPay]=useState<K|null>(null);
  const [saving,setSaving]=useState(false);
  const [kName,setKName]=useState('');
  const [kPhone,setKPhone]=useState('');
  const [kWT,setKWT]=useState<'monthly'|'daily'|'per_piece'>('per_piece');
  const [kWage,setKWage]=useState('');
  const [payAmt,setPayAmt]=useState('');
  const today=new Date().toISOString().slice(0,10);
  const load=async()=>{const bid=await getBusinessId();setList(await sbSelect<K>(`karigars?business_id=eq.${bid}&is_active=eq.true&order=name`));setLoading(false);};
  useEffect(()=>{void load();},[]);
  const addK=async()=>{if(!kName.trim()){Alert.alert('Naam','Karigar ka naam likhein');return;}setSaving(true);const bid=await getBusinessId();await sbInsert('karigars',{business_id:bid,name:kName.trim(),phone:kPhone.trim()||null,wage_type:kWT,wage_amount:Number(kWage)||0});setSaving(false);setShowAdd(false);setKName('');setKPhone('');setKWage('');void load();};
  const pay=async()=>{if(!showPay)return;const amt=Number(payAmt);if(!amt){Alert.alert('Amount','Amount likhein');return;}setSaving(true);await sbInsert('karigar_payments',{karigar_id:showPay.id,amount:amt,method:'cash'});setSaving(false);setShowPay(null);setPayAmt('');Alert.alert('Done',rupees(amt)+' pay ho gaye');};
  const markAtt=async(k:K,status:'present'|'absent')=>{await sbInsert('karigar_attendance',{karigar_id:k.id,attendance_date:today,status});Alert.alert('Hazri',k.name+' - '+status);};
  return(
    <View style={s.c}>
      <View style={s.hr}><TouchableOpacity onPress={()=>router.back()}><Text style={s.bk}>←</Text></TouchableOpacity><Text style={s.h1}>Karigar</Text><TouchableOpacity style={s.ab} onPress={()=>setShowAdd(true)}><Text style={s.abt}>+ Karigar</Text></TouchableOpacity></View>
      <Text style={{color:C.subtle,fontSize:11,marginBottom:12}}>Aaj: {today}</Text>
      {loading?<ActivityIndicator color={C.primary} style={{marginTop:40}}/>:(
        <ScrollView contentContainerStyle={{paddingBottom:40}}>
          {list.map(k=>(
            <View key={k.id} style={s.row}>
              <View style={{flex:1}}><Text style={s.nm}>{k.name}</Text><Text style={s.mt}>{WL[k.wage_type]} · Rs {Number(k.wage_amount).toLocaleString('en-PK')}{k.wage_type==='per_piece'?'/pc':''}</Text></View>
              <View style={{gap:6,alignItems:'flex-end'}}>
                <View style={{flexDirection:'row',gap:6}}>
                  <TouchableOpacity style={s.mb} onPress={()=>markAtt(k,'present')}><Text style={s.mbt}>✓ Hazir</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.mb,{borderColor:'#ef4444'}]} onPress={()=>markAtt(k,'absent')}><Text style={[s.mbt,{color:'#ef4444'}]}>✗ Ghair</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={[s.mb,{borderColor:C.warn}]} onPress={()=>setShowPay(k)}><Text style={[s.mbt,{color:C.warn}]}>💵 Pay</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          {list.length===0&&<Text style={s.em}>Koi karigar nahi</Text>}
        </ScrollView>
      )}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={()=>setShowAdd(false)}>
        <View style={s.ov}><View style={s.md}>
          <Text style={s.h2}>Naya Karigar</Text>
          <TextInput style={s.in} placeholder="Naam *" placeholderTextColor={C.subtle} value={kName} onChangeText={setKName}/>
          <TextInput style={s.in} placeholder="Phone" placeholderTextColor={C.subtle} keyboardType="phone-pad" value={kPhone} onChangeText={setKPhone}/>
          <View style={{flexDirection:'row',gap:6,marginBottom:8}}>
            {(['per_piece','daily','monthly'] as const).map(w=><TouchableOpacity key={w} style={[s.wb,kWT===w&&s.wa]} onPress={()=>setKWT(w)}><Text style={[s.wt,kWT===w&&{color:C.bg}]}>{WL[w]}</Text></TouchableOpacity>)}
          </View>
          <TextInput style={s.in} placeholder="Rate (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={kWage} onChangeText={setKWage}/>
          <TouchableOpacity style={s.sv} disabled={saving} onPress={addK}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.svt}>✓ Save</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowAdd(false)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={!!showPay} transparent animationType="slide" onRequestClose={()=>setShowPay(null)}>
        <View style={s.ov}><View style={s.md}>
          <Text style={s.h2}>Pay — {showPay?.name}</Text>
          <TextInput style={[s.in,{marginTop:8}]} placeholder="Amount (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={payAmt} onChangeText={setPayAmt}/>
          <TouchableOpacity style={s.sv} disabled={saving} onPress={pay}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.svt}>✓ Pay</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowPay(null)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}
const s=StyleSheet.create({c:{flex:1,backgroundColor:C.bg,padding:16,paddingTop:56},hr:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:6},bk:{color:C.muted,fontSize:22},h1:{fontSize:22,fontWeight:'800',color:C.text,flex:1},h2:{fontSize:18,fontWeight:'700',color:C.text,marginBottom:10},ab:{backgroundColor:C.primary,borderRadius:9,paddingHorizontal:12,paddingVertical:7},abt:{color:C.bg,fontWeight:'800',fontSize:12},row:{flexDirection:'row',backgroundColor:C.card,borderRadius:12,padding:14,marginBottom:8},nm:{color:C.text,fontWeight:'700',fontSize:14},mt:{color:C.subtle,fontSize:11,marginTop:2},mb:{borderWidth:1,borderColor:C.primary,borderRadius:7,paddingHorizontal:8,paddingVertical:4},mbt:{color:C.primary,fontSize:10,fontWeight:'700'},em:{color:C.subtle,textAlign:'center',padding:30},ov:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24},md:{backgroundColor:C.bg,borderRadius:16,padding:20,borderWidth:1,borderColor:C.border},wb:{flex:1,borderWidth:1,borderColor:C.border,borderRadius:10,paddingVertical:9,alignItems:'center'},wa:{backgroundColor:C.primary,borderColor:C.primary},wt:{color:C.muted,fontSize:11,fontWeight:'700'},in:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,padding:12,color:C.text,marginBottom:8},sv:{backgroundColor:C.primary,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:4},svt:{color:C.bg,fontWeight:'800'}});