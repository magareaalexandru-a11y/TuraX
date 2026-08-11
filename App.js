import { Picker } from "@react-native-picker/picker";
import 'react-native-url-polyfill/auto'
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://hfqijvzfjmuysuwdoxej.supabase.co';
const supabaseKey = 'sb_publishable_KJkUOxPP0_8JFtbTzWN0oA_qGA_gtcm';
const supabase = createClient(supabaseUrl, supabaseKey);
export default function App() {
  const [screen, setScreen] = useState('home');
  const [negotiable, setNegotiable] = useState(true);
  const [workTypes, setWorkTypes] = useState([]);
  const [horecaSkills, setHorecaSkills] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [dayAvailability, setDayAvailability] = useState({});

  // ECRAN OSPĂTAR
  if (screen === 'waiter') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formPage}>

          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.back}>← Înapoi</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Profil ospătar</Text>

          <Text style={styles.pageSubtitle}>
            Completează datele tale pentru a găsi ture potrivite.
          </Text>

          <TextInput
            placeholder="Nume complet"
            placeholderTextColor= "#8A8F98"
            style={styles.input}
          />
<TextInput
            placeholder="Oraș"
            placeholderTextColor="#8A8F98"
            style={styles.input}
          />

          <TextInput
            placeholder="Ani de experiență"
        placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

      <Text style={{fontSize:16,fontWeight:"600",marginBottom:8,color:"#6B7280"}}>Experiență în</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {["Restaurant","Bar / Pub","Cafenea","Hotel","Evenimente (nunți, botezuri etc.)"].map((item)=>(
          <TouchableOpacity key={item} onPress={()=>setWorkTypes(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item])} style={{paddingVertical:10,paddingHorizontal:14,borderRadius:20,borderWidth:1,borderColor:workTypes.includes(item)?"#111827":"#D1D5DB",backgroundColor:workTypes.includes(item)?"#111827":"#FFFFFF"}}>
            <Text style={{fontWeight:"600",color:workTypes.includes(item)?"#FFFFFF":"#111827"}}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{fontSize:16,fontWeight:"600",marginBottom:8,color:"#6B7280"}}>Competențe HoReCa</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {["Servire à la carte","POS / Casă de marcat","Servire băuturi","Preparare băuturi / Bar","Gestionare mese","Evenimente","Lucru în echipă"].map((item)=>(
          <TouchableOpacity key={item} onPress={()=>setHorecaSkills(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item])} style={{paddingVertical:10,paddingHorizontal:14,borderRadius:20,borderWidth:1,borderColor:horecaSkills.includes(item)?"#111827":"#D1D5DB",backgroundColor:horecaSkills.includes(item)?"#111827":"#FFFFFF"}}>
            <Text style={{fontWeight:"600",color:horecaSkills.includes(item)?"#FFFFFF":"#111827"}}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

          <Text style={{fontSize:16,fontWeight:"600",marginBottom:8,color:"#6B7280"}}>Zile disponibile</Text>
      <Text style={{fontSize:13,color:"#9CA3AF",marginBottom:10}}>Selectează zilele în care poți accepta ture</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {["Lun","Mar","Mie","Joi","Vin","Sâm","Dum"].map((day)=>(
          <TouchableOpacity
            key={day}
            onPress={()=>setAvailableDays(prev=>prev.includes(day)?prev.filter(x=>x!==day):[...prev,day])}
            style={{
              paddingVertical:10,
              paddingHorizontal:14,
              borderRadius:20,
              borderWidth:1,
              borderColor:availableDays.includes(day)?"#111827":"#D1D5DB",
              backgroundColor:availableDays.includes(day)?"#111827":"#FFFFFF"
            }}
          >
            <Text style={{fontWeight:"600",color:availableDays.includes(day)?"#FFFFFF":"#111827"}}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {availableDays.length > 0 && (
        <View style={{marginBottom:16}}>
          {availableDays.map((day) => {
            const info = dayAvailability[day] || {mode:"all",start:"",end:""};
            const setMode = (mode) => setDayAvailability(prev => ({
              ...prev,
              [day]: {...(prev[day] || {}), mode}
            }));
            return (
              <View key={day} style={{borderWidth:1,borderColor:"#E5E7EB",borderRadius:14,padding:12,marginBottom:10}}>
                <Text style={{fontSize:15,fontWeight:"700",marginBottom:10}}>{day}</Text>

                <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
                  {[
                    ["all","Toată ziua"],
                    ["first","09⁰⁰–16⁰⁰"],
                    ["second","17⁰⁰–00⁰⁰"],
                    ["custom","Personalizat"]
                  ].map(([mode,label]) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={()=>setMode(mode)}
                      style={{
                        paddingVertical:9,
                        paddingHorizontal:12,
                        borderRadius:18,
                        borderWidth:1,
                        borderColor:info.mode===mode?"#111827":"#D1D5DB",
                        backgroundColor:info.mode===mode?"#111827":"#FFFFFF"
                      }}
                    >
                      <Text style={{fontWeight:"600",color:info.mode===mode?"#FFFFFF":"#111827"}}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {info.mode==="custom" && (
                  <View style={{flexDirection:"row",gap:8,marginTop:10}}>
                    <View style={{flex:1,borderWidth:1,borderColor:"#D1D5DB",borderRadius:12,overflow:"hidden",backgroundColor:"#FFFFFF"}}>
<Picker
  selectedValue={info.start || ""}
  onValueChange={(value)=>setDayAvailability(prev=>({...prev,[day]:{...(prev[day]||{}),mode:"custom",start:value}}))}
  style={{height:50,color:"#111827"}}
>
  <Picker.Item label="De la" value="" />
  {Array.from({length:16},(_,i)=>i+8).map(h=>{
    const ora=String(h).padStart(2,"0")+":00";
    return <Picker.Item key={ora} label={ora.replace(":00","⁰⁰")} value={ora} />;
  })}
</Picker>
</View>
                    <View style={{flex:1,borderWidth:1,borderColor:"#D1D5DB",borderRadius:12,overflow:"hidden",backgroundColor:"#FFFFFF"}}>
<Picker
  selectedValue={info.end || ""}
  onValueChange={(value)=>setDayAvailability(prev=>({...prev,[day]:{...(prev[day]||{}),mode:"custom",end:value}}))}
  style={{height:50,color:"#111827"}}
>
  <Picker.Item label="Până la" value="" />
  {(info.start
    ? Array.from({length:16},(_,i)=>(parseInt(info.start,10)+i+1)%24)
    : Array.from({length:17},(_,i)=>(i+8)%24)
  ).map(hour=>{
    const ora=String(hour).padStart(2,"0")+":00";
    return <Picker.Item key={ora+"end"} label={ora.replace(":00","⁰⁰")} value={ora} />;
  })}
</Picker>
</View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Text style={{fontSize:16,fontWeight:"600",marginBottom:8,color:"#6B7280"}}>Interval tarifar dorit</Text>
      {negotiable ? (
        <View style={{flexDirection:"row",gap:10,marginBottom:12}}>
          <TextInput
            placeholder="De la (lei/tură)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={[styles.input,{flex:1,marginBottom:0}]}
          />
          <TextInput
            placeholder="Până la (lei/tură)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={[styles.input,{flex:1,marginBottom:0}]}
          />
        </View>
      ) : (
        <TextInput
          placeholder="Tarif dorit (lei/tură)"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          style={styles.input}
        />
      )}
      <View style={{flexDirection:"row",gap:10,marginBottom:16}}>
        <TouchableOpacity onPress={()=>setNegotiable(true)} style={{flex:1,padding:14,borderRadius:12,borderWidth:1,borderColor:negotiable?"#111827":"#D1D5DB",alignItems:"center",backgroundColor:negotiable?"#111827":"#FFFFFF"}}>
          <Text style={{fontWeight:"600",color:negotiable?"#FFFFFF":"#111827"}}>Negociabil</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setNegotiable(false)} style={{flex:1,padding:14,borderRadius:12,borderWidth:1,borderColor:!negotiable?"#111827":"#D1D5DB",alignItems:"center",backgroundColor:!negotiable?"#111827":"#FFFFFF"}}>
          <Text style={{fontWeight:"600",color:!negotiable?"#FFFFFF":"#111827"}}>Tarif fix</Text>
        </TouchableOpacity>
      </View>

      <TextInput
            placeholder="Descriere scurtă despre tine"
        placeholderTextColor="#9CA3AF"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Salvează profilul
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ECRAN RESTAURANT / ANGAJATOR
  if (screen === 'employer') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formPage}>

          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.back}>← Înapoi</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>
            Publică o tură
          </Text>

          <Text style={styles.pageSubtitle}>
            Spune de câți ospătari ai nevoie și când.
          </Text>

          <TextInput
            placeholder="Numele restaurantului / locației"
            style={styles.input}
          />

          <TextInput
            placeholder="Oraș"
            style={styles.input}
          />

          <TextInput
            placeholder="Tip eveniment"
            style={styles.input}
          />

          <TextInput
            placeholder="Data evenimentului"
            style={styles.input}
          />

          <TextInput
            placeholder="Interval orar (ex: 16:00 - 02:00)"
            style={styles.input}
          />

          <TextInput
            placeholder="Număr ospătari necesari"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            placeholder="Plată / ospătar (lei)"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            placeholder="Detalii suplimentare"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Publică tura
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ECRAN PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>TuraX</Text>

        <Text style={styles.subtitle}>
          Găsește ture. Găsește oameni.
        </Text>
      </View>

      <View style={styles.content}>

        <Text style={styles.welcome}>
          Bun venit! 👋
        </Text>

        <Text style={styles.question}>
          Ce vrei să faci astăzi?
        </Text>

        <TouchableOpacity
          style={styles.waiterButton}
          onPress={() => setScreen('waiter')}
        >
          <Text style={styles.icon}>👨‍🍳</Text>

          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitleDark}>
              Sunt ospătar
            </Text>

            <Text style={styles.buttonTextDark}>
              Caut evenimente și ture suplimentare
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restaurantButton}
          onPress={() => setScreen('employer')}
        >
          <Text style={styles.icon}>🏨</Text>

          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitleLight}>
              Sunt restaurant / angajator
            </Text>

            <Text style={styles.buttonTextLight}>
              Caut ospătari pentru ture și evenimente
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.info}>
          TuraX conectează ospătarii disponibili cu restaurantele
          care au nevoie de oameni.
        </Text>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  header: {
    backgroundColor: '#111827',
    paddingTop: 35,
    paddingBottom: 30,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },

  question: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 30,
  },

  waiterButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  restaurantButton: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 38,
    marginRight: 16,
  },

  buttonContent: {
    flex: 1,
  },

  buttonTitleDark: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 5,
  },

  buttonTextDark: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  buttonTitleLight: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },

  buttonTextLight: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },

  info: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 30,
    paddingHorizontal: 15,
  },

  formPage: {
    padding: 24,
    paddingBottom: 50,
  },

  back: {
    fontSize: 17,
    color: '#111827',
    marginBottom: 25,
    marginTop: 10,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 25,
    lineHeight: 21,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 14,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 17,
    borderRadius: 14,
    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
});