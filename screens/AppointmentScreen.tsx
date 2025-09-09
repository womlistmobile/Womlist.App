// screens/AppointmentScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
  ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.15:45472/api';

const THEME = { primary:'#FF6B00', card:'#F4F5F7', text:'#1F2328', sub:'#6B7280', line:'#E5E7EB' };

type Slot = { startISO: string; endISO: string; label: string };
type Hour = { dayOfWeek: number; isClosed: boolean; open: string|null; close: string|null };

const normId = (x:any)=> Number(x?.id ?? x?.Id);
const normName = (x:any)=> x?.name ?? x?.Name ?? x?.fullName ?? x?.FullName ?? 'Ad';
const normDuration = (x:any)=> Number(x?.duration ?? x?.Duration ?? 0);

const DOW = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const normalizeHours = (raw: any[]): Hour[] =>
  (Array.isArray(raw)?raw:[])
  .map((h:any)=>{
    let d=-1;
    const v=h?.dayOfWeek ?? h?.DayOfWeek;
    if (typeof v==='number') d=v;
    else if (typeof v==='string') { const i=DOW.indexOf(v.toLowerCase()); if(i>=0) d=i; }
    const open=(h?.open ?? h?.Open ?? h?.openTime ?? h?.OpenTime) ?? null;
    const close=(h?.close ?? h?.Close ?? h?.closeTime ?? h?.CloseTime) ?? null;
    return { dayOfWeek:d, isClosed: !!(h?.isClosed ?? h?.IsClosed), open, close };
  }).filter(x=>x.dayOfWeek>=0);

const toYMD = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const labelHM = (date:Date)=> date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

const makeHeaders = (token?:string|null)=> ({ ...(token?{Authorization:`Bearer ${token}`}:{}) });
const makeJsonHeaders = (token?:string|null)=> ({...makeHeaders(token),'Content-Type':'application/json'});

// HH:mm -> Date (seçili gün, yerel saat)
const buildDateFromHM = (day:Date, hm:string)=>{
  const [H,M] = hm.split(':').map(n=>parseInt(n,10));
  const d = new Date(day);
  d.setHours(H||0, M||0, 0, 0);
  return d;
};

// slot’ları saat penceresine kırp
const clampToWindow = (slots:Slot[], day:Date, window:Hour|null):Slot[]=>{
  if (!window || window.isClosed || !window.open || !window.close) return [];
  const openAt  = buildDateFromHM(day, window.open).getTime();
  const closeAt = buildDateFromHM(day, window.close).getTime();
  return slots.filter(s=>{
    const a = +new Date(s.startISO);
    const b = +new Date(s.endISO);
    return a >= openAt && b <= closeAt;
  });
};

export default function AppointmentScreen({ route, navigation }:any) {
  const { provider } = route.params;
  const providerId = useMemo(()=> normId(provider), [provider]);

  const [token, setToken] = useState<string|null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [hours, setHours] = useState<Hour[]>([]);
  const [staffHours, setStaffHours] = useState<Record<number, Hour[]>>({});

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number|null>(null);

  const [days, setDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot|null>(null);
  const [emptyReason, setEmptyReason] = useState('');
  const [openCloseText, setOpenCloseText] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);

  // 14 günlük şerit
  useEffect(()=>{
    const arr:Date[]=[]; const start=new Date(); start.setHours(0,0,0,0);
    for(let i=0;i<14;i++){ const d=new Date(start); d.setDate(start.getDate()+i); arr.push(d); }
    setDays(arr);
  },[]);

  useEffect(()=>{
    (async ()=>{
      const t = await AsyncStorage.getItem('token'); setToken(t);
      if(!providerId) return;
      await Promise.all([fetchServices(t), fetchStaff(t), fetchHours(t)]);
    })();
  },[providerId]);

  // Açılış-kapanış yazısı + slot üretim
  useEffect(()=>{
    const baseH = selectedStaff
      ? (staffHours[selectedStaff]||[]).find(x=>x.dayOfWeek===selectedDate.getDay())
      : hours.find(x=>x.dayOfWeek===selectedDate.getDay());
    if (!baseH) setOpenCloseText('');
    else if (baseH.isClosed) setOpenCloseText('Bugün kapalı');
    else if (baseH.open && baseH.close) setOpenCloseText(`Açılış–Kapanış: ${baseH.open} – ${baseH.close}`);
    else setOpenCloseText('');

    if(!token || !providerId) return;
    if(totalDuration<=0){
      setSlots([]); setBusy([]); setSelectedSlot(null);
      setEmptyReason('Önce hizmet seçin; uygun saatler buna göre listelenir.');
      return;
    }
    buildSlots(selectedDate, selectedStaff);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[token, providerId, selectedDate, selectedStaff, selectedServices.join(','), JSON.stringify(hours), JSON.stringify(staffHours)]);

  const fetchServices = async (t?:string|null)=>{
    try{
      const r=await fetch(`${API}/service/provider/${providerId}`,{headers:makeHeaders(t)});
      setServices(await r.json());
    }catch{ setServices([]); }
  };

  const fetchStaff = async (t?:string|null)=>{
    try{
      const r=await fetch(`${API}/staff/provider/${providerId}`,{headers:makeHeaders(t)});
      const list = await r.json();
      setStaff(list);

      const map:Record<number,Hour[]> = {};
      for (const s of (Array.isArray(list)?list:[])) {
        const id = normId(s);
        try {
          const rr = await fetch(`${API}/staff/${id}/hours`, { headers: makeHeaders(t) });
          const hh = await rr.json();
          map[id] = normalizeHours(hh);
        } catch { map[id] = []; }
      }
      setStaffHours(map);
    }catch{ setStaff([]); setStaffHours({}); }
  };

  const fetchHours = async (t?:string|null)=>{
    try{
      const r=await fetch(`${API}/ServiceProviders/${providerId}/hours`,{headers:makeHeaders(t)});
      const raw=await r.json();
      setHours(normalizeHours(raw));
    }catch{ setHours([]); }
  };

  // API uygunluk
  const fetchAvailability = async (date:Date, durationMin:number, staffIdParam:number|null)=>{
    const ymd=toYMD(date);
    const url = `${API}/ServiceProviders/${providerId}/availability?date=${ymd}&slot=15&duration=${durationMin}` + (staffIdParam?`&staffId=${staffIdParam}`:'');
    const r=await fetch(url,{headers:makeHeaders(token)});
    const j=await r.json();
    const available:(any[])=(j?.available ?? j?.Available ?? []);
    const booked:(any[])=(j?.booked ?? j?.Booked ?? []);
    const toSlot = (x:any):Slot|null=>{
      const s=x?.start ?? x?.Start ?? x?.startTime ?? x?.StartTime;
      const e=x?.end ?? x?.End ?? x?.endTime ?? x?.EndTime;
      if(!s||!e) return null;
      const sd=new Date(s), ed=new Date(e);
      return { startISO: sd.toISOString(), endISO: ed.toISOString(), label: labelHM(sd) };
    };
    return { available: available.map(toSlot).filter(Boolean) as Slot[], booked: booked.map(toSlot).filter(Boolean) as Slot[], closed: !!j?.closed };
  };

     // Yerel fallback slot üretimi
   const buildFromLocalHours = (date:Date, durationMin:number, base:Hour|null):Slot[]=>{
     if (!base || base.isClosed || !base.open || !base.close) return [];
     const start = buildDateFromHM(date, base.open);
     const end   = buildDateFromHM(date, base.close);
    const out:Slot[]=[];
     
                // Slot hesaplama: 15 dakikalık aralıklarla, son slot 18:00'da bitmeli
     let currentTime = new Date(start);
     
     while (currentTime.getTime() + durationMin * 60000 <= end.getTime()) {
       const slotStart = new Date(currentTime);
       const slotEnd = new Date(currentTime.getTime() + durationMin * 60000);
       
       out.push({ 
         startISO: slotStart.toISOString(), 
         endISO: slotEnd.toISOString(), 
         label: labelHM(slotStart) 
       });
       
       // Sonraki slot için 15 dakika ilerle
       currentTime.setMinutes(currentTime.getMinutes() + 15);
     }
      
      // React Native'de debug için Alert kullan
      const debugInfo = `SLOT DEBUG:
Base: ${base?.open}-${base?.close}
Start: ${start.toLocaleTimeString()}
End: ${end.toLocaleTimeString()}
Duration: ${durationMin}min
Total: ${out.length}
First: ${out[0]?.label || 'none'}
Last: ${out[out.length-1]?.label || 'none'}`;
      
             // Debug bilgilerini göster
       console.log('🔍 SLOT DEBUG:', debugInfo);
       
              // Test için Alert'i aktif et (geliştirme sırasında)
       if (__DEV__) {
         Alert.alert('Slot Debug', debugInfo);
       }
    return out;
  };

  const buildSlots = async (date:Date, staffId?:number|null)=>{
    setLoadingSlots(true); setSelectedSlot(null); setEmptyReason(''); setSlots([]); setBusy([]);

    try{
      const av = await fetchAvailability(date, totalDuration, staffId ?? null);
      let candidate = av.available.slice();
      const booked = av.booked.slice();

      // SUNUCU DÖNÜŞÜNÜ DE SAAT PENCERESİNE GÖRE KIRP
      const base = staffId
        ? (staffHours[staffId||0]||[]).find(h=>h.dayOfWeek===date.getDay()) || null
        : hours.find(h=>h.dayOfWeek===date.getDay()) || null;
      candidate = clampToWindow(candidate, date, base);

                       // Sunucu boş/verimsizse yerel fallback
      if(!candidate.length && !av.closed){
        candidate = buildFromLocalHours(date, totalDuration, base);
        console.log('Local fallback slots:', candidate.length, 'base hours:', base?.open, '-', base?.close);
        console.log('Generated slots:', candidate.map(s => ({ start: s.label, end: labelHM(new Date(s.endISO)) })));
      }

      // Çakışmaları ele
      setBusy(booked);
      const filtered = candidate.filter(a=>{
        const s = +new Date(a.startISO), e = +new Date(a.endISO);
        return !booked.some(b => s < +new Date(b.endISO) && +new Date(b.startISO) < e );
      });

      setSlots(filtered);
      if(!filtered.length){
        if (av.closed) setEmptyReason('Bugün işletme kapalı.');
        else if (staffId){
          const sh = (staffHours[staffId]||[]).find(h=>h.dayOfWeek===date.getDay());
          setEmptyReason(sh?.isClosed ? 'Seçilen personel bu gün çalışmıyor.' : 'Seçilen personel için uygun saat bulunamadı.');
        } else setEmptyReason('Bu gün için uygun saat bulunamadı.');
      }
    }catch{
      setEmptyReason('Sunucudan veri alınamadı.');
    }finally{
      setLoadingSlots(false);
    }
  };

  const toggleService = (id:number)=>{
    setSelectedServices(prev=> prev.includes(id)? prev.filter(s=>s!==id) : [...prev,id]);
    setSelectedSlot(null);
  };

  const selectStaff = (id:number)=>{
    setSelectedStaff(prev=> prev===id ? null : id);
    setSelectedSlot(null);
  };

  const totalDuration = useMemo(
    ()=> services.filter((s:any)=>selectedServices.includes(normId(s))).reduce((sum:number,it:any)=>sum+normDuration(it),0),
    [services, selectedServices]
  );

  // “toplam süre” bilgisi ve son başlayabileceğin saat (bilgilendirme)
  const durationInfo = useMemo(()=>{
    const base = selectedStaff
      ? (staffHours[selectedStaff]||[]).find(h=>h.dayOfWeek===selectedDate.getDay()) || null
      : hours.find(h=>h.dayOfWeek===selectedDate.getDay()) || null;

    if (!base || base.isClosed || !base.open || !base.close || totalDuration<=0) return '';
    const end = buildDateFromHM(selectedDate, base.close);
    const lastStart = new Date(end.getTime() - totalDuration*60000);
    return `Toplam süre: ${totalDuration} dk • Son başlangıç: ${labelHM(lastStart)}`;
  }, [selectedDate, selectedStaff, hours, staffHours, totalDuration]);

  const createAppointment = async ()=>{
    try{
      if(selectedServices.length===0) return Alert.alert('Hata','Lütfen en az bir hizmet seçiniz.');
      if(!selectedSlot) return Alert.alert('Hata','Lütfen bir saat seçiniz.');
      const userId = await AsyncStorage.getItem('userId');
      const tkn = token || (await AsyncStorage.getItem('token'));
      if(!userId || !tkn) return Alert.alert('Hata','Giriş yapmanız gerekiyor.');

      const payload = {
        userId:Number(userId),
        providerId,
        staffId:selectedStaff ?? undefined,
        serviceIds:selectedServices,
        date:selectedSlot.startISO,
      };
      const res = await fetch(`${API}/appointment`, { method:'POST', headers:makeJsonHeaders(tkn), body:JSON.stringify(payload) });
      if(!res.ok){
        const txt=await res.text();
        try{ Alert.alert('Hata', JSON.parse(txt)?.message || 'Randevu oluşturulamadı.'); }
        catch{ Alert.alert('Hata', txt || 'Randevu oluşturulamadı.'); }
        return;
      }
      Alert.alert('Başarılı','Randevu talebiniz oluşturuldu. İşletmenin onayı bekleniyor.');
      navigation.goBack();
    }catch{ Alert.alert('Hata','Sunucuya bağlanılamadı.'); }
  };

  // UI ------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Randevu Al</Text>

      {/* HİZMETLER */}
      <Text style={styles.sectionTitle}>Hizmet Seç</Text>
      <View style={styles.wrapRow}>
        {services.map(item=>{
          const id=normId(item); const active=selectedServices.includes(id);
          return (
            <TouchableOpacity key={String(id)} style={[styles.chip, active && styles.chipActive]} onPress={()=>toggleService(id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {normName(item)} · {normDuration(item)} dk
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PERSONEL */}
      <Text style={styles.sectionTitle}>Personel (opsiyonel)</Text>
      <Text style={styles.helperText}>Seçmezseniz, tüm uygun personeller için saatler listelenir.</Text>
      <View style={styles.wrapRow}>
        {staff.map(p=>{
          const id=normId(p);
          const name=normName(p);
          const sh = (staffHours[id]||[]).find(h=>h.dayOfWeek===selectedDate.getDay());
          const isAvailable = !!(sh && !sh.isClosed && sh.open && sh.close);
          const active = selectedStaff===id;

          return (
            <TouchableOpacity
              key={String(id)}
              style={[
                styles.personChip,
                active && styles.personChipActive,
                !isAvailable && styles.personChipDisabled
              ]}
              onPress={()=>selectStaff(id)}
              disabled={!isAvailable}
              activeOpacity={0.8}
            >
              <View style={[styles.dot, {backgroundColor: isAvailable ? '#22C55E' : '#EF4444'}]} />
              <Text numberOfLines={1} style={[styles.personText, active && styles.personTextActive, !isAvailable && styles.personTextDisabled]}>
                {name}{' '}{sh ? (sh.isClosed ? '· Kapalı' : `· ${sh.open}-${sh.close}`) : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

             {/* TARİH — küçük çipler */}
      <Text style={styles.sectionTitle}>Tarih</Text>
       <View style={styles.wrapRow}>
        {days.map(d=>{
          const active=toYMD(d)===toYMD(selectedDate);
           const label = d.toLocaleDateString(undefined,{weekday:'short', day:'2-digit', month:'short'});
          return (
             <TouchableOpacity key={toYMD(d)} style={[styles.dayChip, active && styles.dayChipActive]} onPress={()=>setSelectedDate(d)}>
               <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
       </View>

      {!!openCloseText && <Text style={styles.helperText}>{openCloseText}</Text>}
      {!!durationInfo && <Text style={[styles.helperText, {fontWeight:'700', color:THEME.text}]}>{durationInfo}</Text>}

             {/* UYGUN SAATLER */}
      <Text style={styles.sectionTitle}>Uygun Saatler</Text>
      {loadingSlots ? (
         <View style={{paddingVertical:12}}><ActivityIndicator size="small" color={THEME.primary}/></View>
      ) : slots.length===0 ? (
        <Text style={styles.helperText}>{emptyReason || 'Bu gün için uygun saat bulunamadı.'}</Text>
      ) : (
         <>
           {/* Seçili saat gösterimi */}
           {selectedSlot && (
             <View style={styles.selectedSlotInfo}>
               <Text style={styles.selectedSlotText}>
                 Seçilen: {selectedSlot.label} - {labelHM(new Date(selectedSlot.endISO))}
               </Text>
             </View>
           )}
           
           {/* Saat Seç butonu */}
           <TouchableOpacity 
             style={styles.selectTimeBtn} 
             onPress={() => setShowTimeModal(true)}
           >
             <Text style={styles.selectTimeText}>🕐 Saat Seç ({slots.length} müsait)</Text>
           </TouchableOpacity>
           
           {/* Küçük saat önizlemesi (ilk 8 saat) */}
           <View style={styles.slotsPreview}>
             {slots.slice(0, 8).map(item => {
               const active = selectedSlot?.startISO === item.startISO;
            return (
                 <TouchableOpacity 
                   key={item.startISO} 
                   style={[styles.slot, active && styles.slotActive]} 
                   onPress={() => setSelectedSlot(item)}
                 >
                   <Text style={[styles.slotText, active && styles.slotTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
             })}
             {slots.length > 8 && (
               <Text style={styles.moreSlotsText}>+{slots.length - 8} saat daha...</Text>
             )}
           </View>
         </>
       )}

      {/* DOLU SAATLER */}
      {busy.length>0 && (
        <>
          <Text style={styles.sectionTitle}>Dolu Saatler</Text>
          <FlatList
             key="busy-slots"
             data={busy}
             keyExtractor={(it)=>it.startISO+'-'+it.endISO}
             numColumns={3}
            columnWrapperStyle={{gap:8, marginBottom:8}}
            renderItem={({item})=>(
              <View style={styles.busySlot}><Text style={styles.busyText}>{labelHM(new Date(item.startISO))}–{labelHM(new Date(item.endISO))}</Text></View>
            )}
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, (!selectedSlot || selectedServices.length===0) && {opacity:0.55}]}
        onPress={createAppointment} disabled={!selectedSlot || selectedServices.length===0}
      >
        <Text style={styles.saveText}>📅 Randevu Talebi Gönder</Text>
      </TouchableOpacity>

             <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginTop:8, alignItems:'center'}}>
        <Text style={{color:THEME.sub}}>İptal</Text>
      </TouchableOpacity>
       
       {/* SAAT SEÇİM MODAL */}
       {showTimeModal && (
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Saat Seç</Text>
               <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.closeBtn}>
                 <Text style={styles.closeBtnText}>✕</Text>
               </TouchableOpacity>
             </View>
             
             <Text style={styles.modalSubtitle}>
               {slots.length} müsait saat bulundu • {totalDuration} dk süre
             </Text>
             
             <FlatList
               data={slots}
               keyExtractor={(it) => it.startISO}
               numColumns={5}
               columnWrapperStyle={{gap:8, marginBottom:8}}
               renderItem={({item}) => {
                 const active = selectedSlot?.startISO === item.startISO;
                 return (
                   <TouchableOpacity 
                     style={[styles.modalSlot, active && styles.modalSlotActive]} 
                     onPress={() => {
                       setSelectedSlot(item);
                       setShowTimeModal(false);
                     }}
                   >
                     <Text style={[styles.modalSlotText, active && styles.modalSlotTextActive]}>
                       {item.label}
                     </Text>
                   </TouchableOpacity>
                 );
               }}
               style={{maxHeight: 400}}
             />
           </View>
         </View>
       )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:12, backgroundColor:'#fff'},
  title:{fontSize:20, fontWeight:'800', marginBottom:6, color:THEME.primary},

  sectionTitle:{fontSize:15, fontWeight:'800', marginTop:12, marginBottom:6, color:THEME.text},
  helperText:{color:THEME.sub, marginBottom:6, fontSize:12},

  // küçük, kompakt çipler
  wrapRow:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:{ backgroundColor:THEME.card, paddingHorizontal:10, paddingVertical:7, borderRadius:14, borderWidth:1, borderColor:THEME.line },
  chipActive:{ backgroundColor:THEME.primary, borderColor:THEME.primary },
  chipText:{ color:THEME.text, fontWeight:'700', fontSize:12 },
  chipTextActive:{ color:'#fff' },

  personChip:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:7, borderRadius:14, borderWidth:1, borderColor:THEME.line, backgroundColor:'#fff' },
  personChipActive:{ backgroundColor:'#FFF4EC', borderColor:THEME.primary },
  personChipDisabled:{ backgroundColor:'#F8F8F8' },
  personText:{ color:THEME.text, fontWeight:'700', fontSize:12, maxWidth:220 },
  personTextActive:{ color:THEME.primary },
  personTextDisabled:{ color:'#9CA3AF' },
  dot:{ width:8, height:8, borderRadius:4 },

  // TARİH çipleri (küçük)
  dayChip:{ paddingHorizontal:10, paddingVertical:8, borderRadius:14, borderWidth:1, borderColor:THEME.line, backgroundColor:'#fff' },
  dayChipActive:{ borderColor:THEME.primary, backgroundColor:'#FFF4EC' },
  dayChipText:{ color:THEME.text, fontWeight:'700', fontSize:12 },
  dayChipTextActive:{ color:THEME.primary },

  // slotlar
  slot:{ flex:1/4, minWidth:64, height:34, alignItems:'center', justifyContent:'center', borderRadius:10, backgroundColor:'#fff', borderWidth:1, borderColor:THEME.line },
  slotActive:{ backgroundColor:THEME.primary, borderColor:THEME.primary },
  slotText:{ color:THEME.text, fontWeight:'800', fontSize:12 },
  slotTextActive:{ color:'#fff' },

  busySlot:{ flex:1/3, height:34, alignItems:'center', justifyContent:'center', borderRadius:10, backgroundColor:'#F3F4F6', borderWidth:1, borderColor:'#E5E7EB' },
  busyText:{ color:'#9CA3AF', fontWeight:'700', fontSize:12 },

  saveBtn:{ marginTop:6, backgroundColor:THEME.primary, paddingVertical:12, borderRadius:12, alignItems:'center' },
  saveText:{ color:'#fff', fontSize:15, fontWeight:'800' },
  
  // Yeni eklenen stiller
  selectedSlotInfo:{ backgroundColor:'#F0F9FF', padding:12, borderRadius:8, borderWidth:1, borderColor:'#0EA5E9', marginBottom:8 },
  selectedSlotText:{ color:'#0C4A6E', fontWeight:'700', fontSize:13, textAlign:'center' },
  selectTimeBtn:{ backgroundColor:THEME.primary, paddingVertical:12, paddingHorizontal:16, borderRadius:12, alignItems:'center', marginBottom:12 },
  selectTimeText:{ color:'#fff', fontSize:15, fontWeight:'700' },
  slotsPreview:{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:8 },
  moreSlotsText:{ color:THEME.sub, fontSize:12, fontStyle:'italic', textAlign:'center', width:'100%', marginTop:4 },
  
  // Modal stilleri
  modalOverlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modalContent:{ backgroundColor:'#fff', borderRadius:16, padding:20, width:'90%', maxHeight:'80%' },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  modalTitle:{ fontSize:20, fontWeight:'800', color:THEME.text },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:'#F3F4F6', justifyContent:'center', alignItems:'center' },
  closeBtnText:{ fontSize:18, color:THEME.sub, fontWeight:'700' },
  modalSubtitle:{ color:THEME.sub, fontSize:14, marginBottom:16, textAlign:'center' },
  modalSlot:{ width:60, height:40, backgroundColor:'#fff', borderWidth:1, borderColor:THEME.line, borderRadius:8, justifyContent:'center', alignItems:'center' },
  modalSlotActive:{ backgroundColor:THEME.primary, borderColor:THEME.primary },
  modalSlotText:{ color:THEME.text, fontWeight:'600', fontSize:12 },
  modalSlotTextActive:{ color:'#fff' },
});
