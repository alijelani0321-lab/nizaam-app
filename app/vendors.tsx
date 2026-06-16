import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { sbSelect, sbInsert, sbUpdate, getBusinessId, rupees } from '@/lib/supabaseRest';
const C = { bg:'#0f172a',card:'#1e293b',border:'#334155',text:'#e2e8f0',muted:'#94a3b8',subtle:'#64748b',primary:'#49dfbd',warn:'#fbbf24' };
interface Vendor { id:number;name:string;phone:string|null;city:string|null;category:string|null;total_purchased:number;current_payable:number; }
export default function VendorsScreen() {
  const [list,setList]=useState<Vendor[]>([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false);
  const [showAdd,setShowAdd]=useState(false); const [showPurchase,setShowPurchase]=useState<Vendor|null>(null); const [showPay,setShowPay]=useState<Vendor|null>(null); const [saving,setSaving]=useState(false);
  const [vName,setVName]=useState(''); const [vPhone,setVPhone]=useState(''); const [vCity,setVCity]=useState(''); const [vCat,setVCat]=useState('');
  const [pDetail,setPDetail]=useState(''); const [pGoods,setPGoods]=useState(''); const [pPack,setPPack]=useState(''); const [pDel,setPDel]=useState(''); const [pPaid,setPPaid]=useState('');
  const [payAmt,setPayAmt]=useState('');
  const load=async()=>{ const bid=await getBusinessId(); setList(await sbSelect<Vendor>(`vendors?business_id=eq.${bid}&order=current_payable.desc`)); setLoading(false);setRefreshing(false); };
  useEffect(()=>{ void load(); },[]);
  const totalPayable=list.reduce((s,v)=>s+Number(v.current_payable||0),0);
  const addVendor=async()=>{ if(!vName.trim()){Alert.alert('Naam','Vendor ka naam likhein');return;} setSaving(true); const bid=await getBusinessId(); await sbInsert('vendors',{business_id:bid,name:vName.trim(),phone:vPhone.trim()||null,city:vCity.trim()||null,category:vCat.trim()||null}); setSaving(false);setShowAdd(false);setVName('');setVPhone('');setVCity('');setVCat(''); void load(); };
  const addPurchase=async()=>{ if(!showPurchase)return; const goods=Number(pGoods)||0; if(goods<=0){Alert.alert('Cost','Goods cost likhein');return;} setSaving(true); const bid=await getBusinessId(); const pack=Number(pPack)||0; const del=Number(pDel)||0; const total=goods+pack+del; const paid=Number(pPaid)||0; const payable=Math.max(0,total-paid); await sbInsert('purchases',{business_id:bid,vendor_id:showPurchase.id,items_snapshot:[{detail:pDetail}],goods_cost:goods,packaging_cost:pack,delivery_cost:del,total_cost:total,paid,payable,payment_method:'cash'}); await sbUpdate('vendors',`id=eq.${showPurchase.id}`,{total_purchased:Number(showPurchase.total_purchased||0)+total,current_payable:Number(showPurchase.current_payable||0)+payable}); setSaving(false);setShowPurchase(null);setPDetail('');setPGoods('');setPPack('');setPDel('');setPPaid(''); void load(); };
  const payVendor=async()=>{ if(!showPay)return; const amt=Number(payAmt); if(!amt||amt<=0){Alert.alert('Amount','Sahi amount likhein');return;} setSaving(true); const bid=await getBusinessId(); await sbInsert('vendor_payments',{business_id:bid,vendor_id:showPay.id,amount:amt,method:'cash'}); await sbUpdate('vendors',`id=eq.${showPay.id}`,{current_payable:Math.max(0,Number(showPay.current_payable||0)-amt)}); setSaving(false);setShowPay(null);setPayAmt(''); void load(); };
  return (
    <View style={s.container}>
      <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>←</Text></TouchableOpacity><Text style={s.h1}>Vendors</Text><TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnText}>+ Vendor</Text></TouchableOpacity></View>
      <View style={s.totalCard}><Text style={s.totalLabel}>Total Dena Hai</Text><Text style={s.totalValue}>{rupees(totalPayable)}</Text></View>
      {loading?<ActivityIndicator color={C.primary} style={{marginTop:40}}/>:(
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load();}} tintColor={C.primary}/>} contentContainerStyle={{paddingBottom:40}}>
          {list.map(v=>(
            <View key={v.id} style={s.row}>
              <View style={{flex:1}}><Text style={s.name}>{v.name}</Text><Text style={s.meta}>{[v.category,v.city,v.phone].filter(Boolean).join(' · ')||'—'}</Text><Text style={s.meta}>Total: {rupees(v.total_purchased)}</Text></View>
              <View style={{alignItems:'flex-end',gap:6}}>
                {Number(v.current_payable)>0&&<Text style={s.payable}>{rupees(v.current_payable)} dena</Text>}
                <View style={{flexDirection:'row',gap:6}}>
                  <TouchableOpacity style={s.miniBtn} onPress={()=>setShowPurchase(v)}><Text style={s.miniBtnText}>+ Purchase</Text></TouchableOpacity>
                  {Number(v.current_payable)>0&&<TouchableOpacity style={[s.miniBtn,{borderColor:C.warn}]} onPress={()=>setShowPay(v)}><Text style={[s.miniBtnText,{color:C.warn}]}>💵 Pay</Text></TouchableOpacity>}
                </View>
              </View>
            </View>
          ))}
          {list.length===0&&<Text style={s.empty}>Koi vendor nahi</Text>}
        </ScrollView>
      )}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={()=>setShowAdd(false)}>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.h2}>Naya Vendor</Text>
          <TextInput style={s.input} placeholder="Naam *" placeholderTextColor={C.subtle} value={vName} onChangeText={setVName}/>
          <TextInput style={s.input} placeholder="Phone" placeholderTextColor={C.subtle} keyboardType="phone-pad" value={vPhone} onChangeText={setVPhone}/>
          <TextInput style={s.input} placeholder="City" placeholderTextColor={C.subtle} value={vCity} onChangeText={setVCity}/>
          <TextInput style={s.input} placeholder="Category (Kapra, Packaging...)" placeholderTextColor={C.subtle} value={vCat} onChangeText={setVCat}/>
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={addVendor}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.saveBtnText}>✓ Save</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowAdd(false)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={!!showPurchase} transparent animationType="slide" onRequestClose={()=>setShowPurchase(null)}>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.h2}>Purchase — {showPurchase?.name}</Text>
          <TextInput style={s.input} placeholder="Kya kharida?" placeholderTextColor={C.subtle} value={pDetail} onChangeText={setPDetail}/>
          <TextInput style={s.input} placeholder="Goods Cost (Rs) *" placeholderTextColor={C.subtle} keyboardType="numeric" value={pGoods} onChangeText={setPGoods}/>
          <View style={{flexDirection:'row',gap:8}}>
            <TextInput style={[s.input,{flex:1}]} placeholder="Packaging" placeholderTextColor={C.subtle} keyboardType="numeric" value={pPack} onChangeText={setPPack}/>
            <TextInput style={[s.input,{flex:1}]} placeholder="Delivery" placeholderTextColor={C.subtle} keyboardType="numeric" value={pDel} onChangeText={setPDel}/>
          </View>
          <TextInput style={s.input} placeholder="Abhi kitna pay kiya?" placeholderTextColor={C.subtle} keyboardType="numeric" value={pPaid} onChangeText={setPPaid}/>
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={addPurchase}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.saveBtnText}>✓ Save</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowPurchase(null)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={!!showPay} transparent animationType="slide" onRequestClose={()=>setShowPay(null)}>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.h2}>Pay — {showPay?.name}</Text>
          <Text style={s.meta}>Dena: {rupees(showPay?.current_payable||0)}</Text>
          <TextInput style={[s.input,{marginTop:10}]} placeholder="Amount (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={payAmt} onChangeText={setPayAmt}/>
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={payVendor}>{saving?<ActivityIndicator color={C.bg}/>:<Text style={s.saveBtnText}>✓ Pay</Text>}</TouchableOpacity>
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={()=>setShowPay(null)}><Text style={{color:C.muted}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:C.bg,padding:16,paddingTop:56},headerRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},back:{color:C.muted,fontSize:22},h1:{fontSize:22,fontWeight:'800',color:C.text,flex:1},h2:{fontSize:18,fontWeight:'700',color:C.text,marginBottom:10},addBtn:{backgroundColor:C.primary,borderRadius:9,paddingHorizontal:12,paddingVertical:7},addBtnText:{color:C.bg,fontWeight:'800',fontSize:12},totalCard:{backgroundColor:C.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.warn+'44'},totalLabel:{color:C.muted,fontSize:12},totalValue:{color:C.warn,fontSize:26,fontWeight:'800',marginTop:2},row:{flexDirection:'row',backgroundColor:C.card,borderRadius:12,padding:14,marginBottom:8},name:{color:C.text,fontWeight:'700',fontSize:14},meta:{color:C.subtle,fontSize:11,marginTop:2},payable:{color:C.warn,fontWeight:'800',fontSize:13},miniBtn:{borderWidth:1,borderColor:C.primary,borderRadius:7,paddingHorizontal:8,paddingVertical:4},miniBtnText:{color:C.primary,fontSize:10,fontWeight:'700'},empty:{color:C.subtle,textAlign:'center',padding:30},overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24},modal:{backgroundColor:C.bg,borderRadius:16,padding:20,borderWidth:1,borderColor:C.border},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,padding:12,color:C.text,marginBottom:8},saveBtn:{backgroundColor:C.primary,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:4},saveBtnText:{color:C.bg,fontWeight:'800'}});