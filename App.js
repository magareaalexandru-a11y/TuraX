import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import 'react-native-url-polyfill/auto'
import { Calendar } from "react-native-calendars";
import React, { useState, useEffect, useRef } from 'react';
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
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [posts, setPosts] = useState([]);

  const handleLogin = async () => {
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });
    if (error) setAuthMessage(error.message);
  };
  const handleSignUp = async () => { setAuthMessage("Se creează..."); const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword }); if (error) setAuthMessage(error.message); else setAuthMessage("Cont creat!"); };

  useEffect(() => {
    const loadRole = async (currentSession) => {
      if (!currentSession?.user?.id) {
        setAuthRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      if (error) {
        console.log('Profile role error:', error.message);
        setAuthRole(null);
        return;
      }

      setAuthRole(data?.role ?? null);
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadRole(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadRole(newSession);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);
  const [screen, setScreen] = useState('home');
  const welcomeScrollRef = useRef(null);
const [selectedRole, setSelectedRole] = useState(null);

const goToRole = (role) => {
  setSelectedRole(role);
  setAuthRole(role);
  setScreen('auth');
};
  const [negotiable, setNegotiable] = useState(true);
  const [workTypes, setWorkTypes] = useState([]);
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [horecaSkills, setHorecaSkills] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [dayAvailability, setDayAvailability] = useState({});
  const [tarifMin, setTarifMin] = useState("");
  const [tarifMax, setTarifMax] = useState("");
  const [tarifFix, setTarifFix] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");

  // ECRAN OSPĂTAR
  const saveProfile = async () => {
    const profile = {
      fullName,
      city,
      experience,
      description,
      workTypes,
      horecaSkills,
    };

    await AsyncStorage.setItem("turax_waiter_profile", JSON.stringify(profile));
  };

  const saveManagerProfile = async () => {
    const managerProfile = {
      locationName,
      locationType,
      locationCity,
      locationAddress,
      contactName,
      contactPhone,
    };

    await AsyncStorage.setItem("turax_manager_profile", JSON.stringify(managerProfile));
    setScreen("employer");
  };

  const publishAvailability = () => {
    const newPost = {
      id: Date.now().toString(),
      type: 'waiter',
      name: fullName || authName || 'Ospătar',
      dates: selectedDates,
      availability: dayAvailability,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
    setScreen("feed");
  };

  if (screen === 'feed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formPage}>
          <Text style={styles.pageTitle}>Feed TuraX</Text>
          {posts.length === 0 ? (
            <Text>Nu există postări încă.</Text>
          ) : (
            posts.map(post => (
              <View key={post.id} style={{marginBottom:16,padding:16,borderWidth:1,borderColor:'#D1D5DB',borderRadius:12}}>
                <Text style={{fontWeight:'700',fontSize:18}}>{post.name}</Text>
                <Text>Disponibilitate ospătar</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }


  if (screen === 'availability') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formPage}>
          <TouchableOpacity onPress={() => setScreen('waiter')}>
            <Text style={styles.back}>← Înapoi</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Publică disponibilitatea</Text>

          <Text style={{fontSize:16,color:"#6B7280",marginBottom:20}}>
            Spune când poți lucra și ce tarif dorești pentru această postare.
          </Text>
          <Text style={{fontSize:16,fontWeight:"700",marginBottom:10}}>
            Alege data sau datele
          </Text>

          <View style={{marginBottom:20,borderRadius:16,overflow:"hidden"}}>
            <Calendar
              minDate={new Date().toISOString().slice(0,10)}
              firstDay={1}
              onDayPress={(day) =>
                setSelectedDates(prev =>
                  prev.includes(day.dateString)
                    ? prev.filter(x => x !== day.dateString)
                    : [...prev, day.dateString]
                )
              }
              markedDates={Object.fromEntries(
                selectedDates.map(date => [
                  date,
                  {selected:true,selectedColor:"#111827"}
                ])
              )}
            />
          </View>


          {selectedDates.length > 0 && (
            <View style={{marginBottom:20}}>
              <Text style={{fontSize:16,fontWeight:"700",marginBottom:10}}>
                Interval orar
              </Text>

              {[...selectedDates].sort().map(date => {
                const info = dayAvailability[date] || {};

                return (
                  <View
                    key={date}
                    style={{
                      marginBottom:14,
                      padding:14,
                      borderWidth:1,
                      borderColor:"#D1D5DB",
                      borderRadius:16,
                      backgroundColor:"#FFFFFF"
                    }}
                  >
                    <Text style={{fontSize:16,fontWeight:"700",marginBottom:10}}>
                      {new Date(date+"T12:00:00").toLocaleDateString("ro-RO",{
                        weekday:"long",
                        day:"numeric",
                        month:"long"
                      })}
                    </Text>
              <Text style={{fontWeight:"600",marginBottom:6}}>Tarif dorit (lei)</Text>
          <TextInput placeholder="Tarif dorit (lei)" keyboardType="numeric" value={info.rate || ""} onChangeText={(value) => setDayAvailability(prev => ({...prev, [date]: {...(prev[date] || {}), rate: value}}))} style={styles.input} />

                    <View style={{flexDirection:"row",gap:10}}>
                      <View style={{flex:1,borderWidth:1,borderColor:"#D1D5DB",borderRadius:12,overflow:"hidden"}}>
                        <Picker
                          selectedValue={info.start || ""}
                          onValueChange={(value) =>
                            setDayAvailability(prev => ({
                              ...prev,
                              [date]: {...(prev[date] || {}), start:value}
                            }))
                          }
                        >
                          <Picker.Item label="De la" value="" />
                          {Array.from({length:24},(_,h)=>{
                            const ora=String(h).padStart(2,"0")+":00";
                            return <Picker.Item key={ora} label={ora} value={ora} />;
                          })}
                        </Picker>
                      </View>

                      <View style={{flex:1,borderWidth:1,borderColor:"#D1D5DB",borderRadius:12,overflow:"hidden"}}>
                        <Picker
                          selectedValue={info.end || ""}
                          onValueChange={(value) =>
                            setDayAvailability(prev => ({
                              ...prev,
                              [date]: {...(prev[date] || {}), end:value}
                            }))
                          }
                        >
                          <Picker.Item label="Până la" value="" />
                          {Array.from({length:24},(_,h)=>{
                            const ora=String(h).padStart(2,"0")+":00";
                            return <Picker.Item key={ora} label={ora} value={ora} />;
                          })}
                        </Picker>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity onPress={publishAvailability} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Publică disponibilitatea
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
        value={fullName}
        onChangeText={setFullName}
            placeholderTextColor= "#8A8F98"
            style={styles.input}
          />
<TextInput
            placeholder="Oraș"
        value={city}
        onChangeText={setCity}
            placeholderTextColor="#8A8F98"
            style={styles.input}
          />

          <TextInput
            placeholder="Ani de experiență"
        value={experience}
        onChangeText={setExperience}
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

          <TextInput
            placeholder="Descriere scurtă despre tine"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#9CA3AF"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TouchableOpacity onPress={saveProfile} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Salvează profilul
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen('availability')}
            style={[styles.primaryButton,{marginTop:12}]}
          >
            <Text style={styles.primaryButtonText}>
              Publică disponibilitatea
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ECRAN RESTAURANT / ANGAJATOR
  // PROFIL MANAGER / LOCATIE
  if (screen === "managerProfile") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formPage}>
          <Text style={styles.pageTitle}>Profil locație</Text>
          <Text style={styles.pageSubtitle}>Completează datele locației tale</Text>

          <TextInput
            placeholder="Numele locației"
            value={locationName}
            onChangeText={setLocationName}
            style={styles.input}
          />

          <TextInput
            placeholder="Tip locație (Restaurant, Bar, Hotel...)"
            value={locationType}
            onChangeText={setLocationType}
            style={styles.input}
          />
          <TextInput
            placeholder="Oraș"
            value={locationCity}
            onChangeText={setLocationCity}
            style={styles.input}
          />

          <TextInput
            placeholder="Adresă / Zonă"
            value={locationAddress}
            onChangeText={setLocationAddress}
            style={styles.input}
          />

          <TextInput
            placeholder="Persoană de contact"
            value={contactName}
            onChangeText={setContactName}
            style={styles.input}
          />

          <TextInput
            placeholder="Telefon"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        <TouchableOpacity onPress={saveManagerProfile} style={[styles.primaryButton,{marginTop:16}]}>
          <Text style={styles.primaryButtonText}>Salvează profilul</Text>
        </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

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

          <TouchableOpacity onPress={publishAvailability} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Publică tura
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Se încarcă TuraX...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'#F7F8FA'}}>
        <ScrollView contentContainerStyle={{padding:24,paddingTop:60}}>
          <Text style={{fontSize:34,fontWeight:'800',marginBottom:8}}>TuraX</Text>
          <Text style={{fontSize:18,marginBottom:24}}>
            {authMode === 'login' ? 'Autentificare' : 'Creează cont'}
          </Text>
{authMode === 'signup' && (
  <>
    <Text style={{fontWeight:'600',marginBottom:6}}>Nume complet</Text>
    <TextInput
      value={authName}
      onChangeText={setAuthName}
      placeholder="Nume și prenume"
      style={styles.input}
    />

  </>
)}

<Text style={{fontWeight:'600',marginTop:18,marginBottom:6}}>Email</Text>
<TextInput
  value={authEmail}
  onChangeText={setAuthEmail}
  placeholder="email@exemplu.ro"
  autoCapitalize="none"
  keyboardType="email-address"
  style={styles.input}
/>

<Text style={{fontWeight:'600',marginTop:14,marginBottom:6}}>Parolă</Text>
<TextInput
  value={authPassword}
  onChangeText={setAuthPassword}
  placeholder="Parola"
  secureTextEntry
  style={styles.input}
/>

{!!authMessage && (
  <Text style={{marginTop:14}}>{authMessage}</Text>
)}

<TouchableOpacity
  onPress={authMode==='login' ? handleLogin : handleSignUp}
  style={[styles.primaryButton,{marginTop:22}]}
>
  <Text style={styles.primaryButtonText}>
    {authMode==='login' ? 'Intră în cont' : 'Creează cont'}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setAuthMessage('');
    setAuthMode(authMode==='login' ? 'signup' : 'login');
  }}
  style={{marginTop:22}}
>
  <Text style={{textAlign:'center',fontWeight:'600'}}>
    {authMode==='login'
      ? 'Nu ai cont? Creează unul'
      : 'Ai deja cont? Autentifică-te'}
  </Text>
</TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (session && authRole === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{flex:1,justifyContent:"center",padding:24}}>
          <Text style={{fontSize:30,fontWeight:"800",marginBottom:10}}>Alege rolul</Text>
          <Text style={{fontSize:17,marginBottom:28}}>Cum vei folosi TuraX?</Text>
          <TouchableOpacity onPress={() => { setAuthRole("waiter"); setScreen("waiter"); }} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sunt ospătar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setAuthRole("manager"); setScreen("managerProfile"); }} style={[styles.primaryButton,{marginTop:14}]}>
            <Text style={styles.primaryButtonText}>Sunt manager</Text>
          </TouchableOpacity>
        </View>
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
          onPress={() => goToRole('waiter')}
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
          onPress={() => goToRole('manager')}
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
