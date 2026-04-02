import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "./Navbar";
import logo from "../images/logo.png";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8082";
function getToken(){return localStorage.getItem("pawster_token")||localStorage.getItem("token")||localStorage.getItem("authToken")||sessionStorage.getItem("token")||"";}
function djFetch(path,opts={}){const token=getToken();return fetch(`${DJANGO}${path}`,{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}), ...opts.headers}});}
function useReveal(){const ref=useRef(null);const[vis,setVis]=useState(false);useEffect(()=>{const io=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true)},{threshold:0.1});if(ref.current)io.observe(ref.current);return()=>io.disconnect();},[]);return[ref,vis];}
function Reveal({children,delay=0}){const[ref,vis]=useReveal();return(<div ref={ref} style={{transition:`opacity 0.7s ease ${delay}ms,transform 0.7s ease ${delay}ms`,opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(20px)"}}>{children}</div>);}

const REASONS=[{icon:"fas fa-plane-departure",label:"Moving abroad or relocating"},{icon:"fas fa-allergies",label:"Allergies in the household"},{icon:"fas fa-baby",label:"New baby or family changes"},{icon:"fas fa-briefcase-medical",label:"Medical or financial hardship"},{icon:"fas fa-home",label:"No longer pet-friendly housing"},{icon:"fas fa-clock",label:"Not enough time to care properly"}];
const STEPS=["Pet Info","Health","Behavior","Reason"];

// ─── Shared styles (module-level so they're stable references) ───
const inp={padding:"0.7rem 1rem",borderRadius:10,border:"1px solid rgba(180,140,60,0.28)",background:"rgba(255,250,232,0.7)",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"0.9rem",color:"#1a4a08",outline:"none",width:"100%"};
const focIn=(e)=>{e.target.style.borderColor="#5aaa30";e.target.style.boxShadow="0 0 0 3px rgba(90,170,48,0.12)";};
const focOut=(e)=>{e.target.style.borderColor="rgba(180,140,60,0.28)";e.target.style.boxShadow="none";};
const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"};
const col={display:"flex",flexDirection:"column",gap:"0.75rem"};

// ─── Sub-components defined at MODULE level to keep stable references ───
const RLabel=({children})=>(
  <label style={{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em",color:"#5a7a40",display:"block",marginBottom:"0.3rem"}}>{children}</label>
);

const RField=({label,children})=>(
  <div style={{display:"flex",flexDirection:"column"}}><RLabel>{label}</RLabel>{children}</div>
);

const RSel=({value,onChange,opts})=>(
  <select value={value} onChange={onChange} style={inp} onFocus={focIn} onBlur={focOut}>
    <option value="">Select…</option>
    {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
  </select>
);

const RYN=({value,onChange})=>(
  <div style={{display:"flex",gap:"0.5rem"}}>
    {[["yes","Yes"],["no","No"]].map(([v,l])=>(
      <button key={v} type="button" onClick={()=>onChange(v)}
        style={{flex:1,padding:"0.6rem",borderRadius:9,fontWeight:800,fontSize:"0.82rem",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
          border:`1px solid ${value===v?"#1c4f09":"rgba(180,140,60,0.28)"}`,
          background:value===v?"#1c4f09":"rgba(255,250,232,0.7)",
          color:value===v?"#fff":"#3a5020"}}>
        {l}
      </button>
    ))}
  </div>
);

const RSecTitle=({icon,title})=>(
  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem 0",borderBottom:"1px solid rgba(180,140,60,0.18)",marginBottom:"0.75rem",marginTop:"0.25rem"}}>
    <i className={`fas fa-${icon}`} style={{color:"#B45A22",fontSize:"0.8rem"}}/>
    <span style={{fontSize:"0.72rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6a3a10"}}>{title}</span>
  </div>
);

// ─── Step content as a component (also module-level) ───
function RehomeStepContent({ step, form, set, setV }) {
  return (
    <>
      {step === 1 && (
        <div style={col}>
          <RSecTitle icon="paw" title="Pet Basics"/>
          <RField label="Pet's Name *">
            <input type="text" required value={form.petName} onChange={set("petName")} style={inp} onFocus={focIn} onBlur={focOut}/>
          </RField>
          <div style={g2}>
            <RField label="Species *">
              <select value={form.species} onChange={set("species")} style={inp} onFocus={focIn} onBlur={focOut}>
                {["Dog","Cat","Rabbit","Bird","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
            </RField>
            <RField label="Gender *">
              <select value={form.gender} onChange={set("gender")} style={inp} onFocus={focIn} onBlur={focOut}>
                {["Male","Female"].map(s=><option key={s}>{s}</option>)}
              </select>
            </RField>
          </div>
          <div style={g2}>
            <RField label="Breed (if known)">
              <input type="text" value={form.breed} onChange={set("breed")} placeholder="e.g. Aspin" style={inp} onFocus={focIn} onBlur={focOut}/>
            </RField>
            <RField label="Age *">
              <input type="text" required value={form.age} onChange={set("age")} placeholder="e.g. 2 years" style={inp} onFocus={focIn} onBlur={focOut}/>
            </RField>
          </div>
          <RField label="How long have you had this pet? *">
            <RSel value={form.durationOwned} onChange={set("durationOwned")} opts={[["Less than 6 months","Less than 6 months"],["6 months-2 years","6 months–2 years"],["2+ years","2+ years"]]}/>
          </RField>
        </div>
      )}

      {step === 2 && (
        <div style={col}>
          <RSecTitle icon="syringe" title="Health Information"/>
          <div style={g2}>
            <RField label="Vaccinated? *"><RYN value={form.isVaccinated} onChange={(v)=>setV("isVaccinated",v)}/></RField>
            <RField label="Spayed / Neutered? *"><RYN value={form.isNeutered} onChange={(v)=>setV("isNeutered",v)}/></RField>
          </div>
          <RField label="Any known medical conditions?">
            <textarea value={form.medicalNotes} onChange={set("medicalNotes")} rows={3} placeholder="Allergies, ongoing treatments, illnesses…" style={{...inp,resize:"vertical",minHeight:80}} onFocus={focIn} onBlur={focOut}/>
          </RField>
          {form.isVaccinated==="yes"&&(
            <div style={{padding:"0.625rem 0.875rem",borderRadius:10,background:"rgba(224,120,32,0.08)",border:"1px solid rgba(224,120,32,0.25)",fontSize:"0.8rem",fontWeight:700,color:"#b05010"}}>
              <i className="fas fa-exclamation-triangle" style={{marginRight:"0.4rem"}}/>Please provide vaccination records when arranging the handover.
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div style={col}>
          <RSecTitle icon="star" title="Behavior & Personality"/>
          <div style={g2}>
            <RField label="Best describes this pet *">
              <RSel value={form.behavior} onChange={set("behavior")} opts={[["Friendly","Friendly"],["Shy","Shy"],["Playful","Playful"],["Aggressive","Aggressive"],["Other","Other"]]}/>
            </RField>
            <RField label="Shown aggression? *"><RYN value={form.hasAggression} onChange={(v)=>setV("hasAggression",v)}/></RField>
          </div>
          {form.behavior==="Other"&&(
            <RField label="Describe behavior">
              <input type="text" value={form.behaviorOther} onChange={set("behaviorOther")} style={inp} onFocus={focIn} onBlur={focOut}/>
            </RField>
          )}
          <div style={g2}>
            <RField label="House-trained?"><RYN value={form.isHouseTrained} onChange={(v)=>setV("isHouseTrained",v)}/></RField>
            <RField label="Leash-trained?"><RYN value={form.isLeashTrained} onChange={(v)=>setV("isLeashTrained",v)}/></RField>
          </div>
          <RSecTitle icon="home" title="Ideal New Home"/>
          <div style={g2}>
            <RField label="Good with children?"><RYN value={form.goodWithChildren} onChange={(v)=>setV("goodWithChildren",v)}/></RField>
            <RField label="Good with other pets?"><RYN value={form.goodWithPets} onChange={(v)=>setV("goodWithPets",v)}/></RField>
          </div>
          <RField label="What type of home is best for this pet?">
            <textarea value={form.idealHomeDesc} onChange={set("idealHomeDesc")} rows={2} placeholder="e.g. Quiet home, patient owner…" style={{...inp,resize:"vertical",minHeight:60}} onFocus={focIn} onBlur={focOut}/>
          </RField>
        </div>
      )}

      {step === 4 && (
        <div style={col}>
          <RSecTitle icon="phone" title="Contact & Reason"/>
          <RField label="Your Contact Number *">
            <input type="tel" required value={form.contact} onChange={set("contact")} placeholder="+63 9XX XXX XXXX" style={inp} onFocus={focIn} onBlur={focOut}/>
          </RField>
          <RField label="Primary Reason for Rehoming *">
            <RSel value={form.reason} onChange={set("reason")} opts={[["Moving / Relocating","Moving / Relocating"],["Allergies","Allergies"],["New baby","New baby"],["Medical / Financial","Medical / Financial"],["Housing change","Housing change"],["Not enough time","Not enough time"],["Other","Other"]]}/>
          </RField>
          <RField label="Additional Details">
            <textarea value={form.details} onChange={set("details")} rows={2} placeholder="Tell us more about your situation…" style={{...inp,resize:"vertical",minHeight:60}} onFocus={focIn} onBlur={focOut}/>
          </RField>
          <RField label="Have you tried other solutions?">
            <textarea value={form.triedAlternatives} onChange={set("triedAlternatives")} rows={2} placeholder="e.g. Asked family, tried training…" style={{...inp,resize:"vertical",minHeight:56}} onFocus={focIn} onBlur={focOut}/>
          </RField>
          <RSecTitle icon="box-open" title="Transition Details"/>
          <RLabel>Can you provide the following?</RLabel>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {[["canProvideFood","Food supply"],["canProvideCarrier","Cage / carrier"],["canProvideRecords","Medical records"]].map(([k,label])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.625rem 0.875rem",borderRadius:10,background:form[k]?"rgba(28,79,9,0.07)":"rgba(255,248,220,0.6)",border:`1px solid ${form[k]?"rgba(90,170,48,0.3)":"rgba(180,140,60,0.22)"}`,cursor:"pointer",transition:"all 0.2s"}}>
                <input type="checkbox" checked={form[k]} onChange={set(k)} style={{width:16,height:16,accentColor:"#1c4f09",cursor:"pointer"}}/>
                <span style={{fontSize:"0.85rem",fontWeight:700,color:"#3a5020"}}>{label}</span>
              </label>
            ))}
          </div>
          <label style={{display:"flex",alignItems:"flex-start",gap:"0.625rem",padding:"0.75rem 0.875rem",borderRadius:10,background:form.understandsPermanent?"rgba(180,90,34,0.08)":"rgba(255,248,220,0.6)",border:`1.5px solid ${form.understandsPermanent?"rgba(180,90,34,0.4)":"rgba(180,140,60,0.28)"}`,cursor:"pointer",transition:"all 0.2s",marginTop:"0.25rem"}}>
            <input type="checkbox" checked={form.understandsPermanent} onChange={set("understandsPermanent")} style={{width:16,height:16,accentColor:"#B45A22",marginTop:2,cursor:"pointer",flexShrink:0}}/>
            <span style={{fontSize:"0.82rem",fontWeight:700,color:"#6a3a10",lineHeight:1.6}}>I understand that rehoming is a <strong>serious and permanent decision</strong>, and I confirm all information is accurate.</span>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.625rem 0.875rem",borderRadius:10,background:"rgba(255,248,220,0.6)",border:"1px solid rgba(180,140,60,0.22)",cursor:"pointer"}}>
            <input type="checkbox" checked={form.openToFollowup} onChange={set("openToFollowup")} style={{width:16,height:16,accentColor:"#1c4f09",cursor:"pointer"}}/>
            <span style={{fontSize:"0.82rem",fontWeight:700,color:"#3a5020"}}>I am open to being contacted for follow-up after placement.</span>
          </label>
        </div>
      )}
    </>
  );
}

export default function Rehome(){
  const{user}=useAuth();
  const[step,setStep]=useState(1);
  const[submitted,setSubmitted]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[form,setForm]=useState({
    petName:"",species:"Dog",breed:"",age:"",gender:"Male",durationOwned:"",
    isVaccinated:"",isNeutered:"",medicalNotes:"",
    behavior:"",behaviorOther:"",hasAggression:"",isHouseTrained:"",isLeashTrained:"",
    goodWithChildren:"",goodWithPets:"",idealHomeDesc:"",
    contact:"",reason:"",details:"",triedAlternatives:"",
    canProvideFood:false,canProvideCarrier:false,canProvideRecords:false,
    understandsPermanent:false,openToFollowup:true
  });

  const set=useCallback((k)=>(e)=>setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value})),[]);
  const setV=useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  const handleSubmit=async(e)=>{
    e.preventDefault();
    if(!form.understandsPermanent){setError("Please confirm you understand rehoming is a permanent decision.");return;}
    if(!form.contact.trim()){setError("Contact number is required.");return;}
    setError("");setLoading(true);
    try{
      const res=await djFetch("/api/approvals/rehoming/",{method:"POST",body:JSON.stringify({
        pet_name:form.petName,species:form.species,breed:form.breed,age:form.age,gender:form.gender,
        duration_owned:form.durationOwned,is_vaccinated:form.isVaccinated==="yes",is_neutered:form.isNeutered==="yes",
        medical_notes:form.medicalNotes,behavior:form.behavior,behavior_other:form.behaviorOther,
        has_aggression:form.hasAggression==="yes",is_house_trained:form.isHouseTrained==="yes",
        is_leash_trained:form.isLeashTrained==="yes",good_with_children:form.goodWithChildren==="yes",
        good_with_pets:form.goodWithPets==="yes",ideal_home_desc:form.idealHomeDesc,contact:form.contact,
        reason:form.reason,details:form.details,tried_alternatives:form.triedAlternatives,
        can_provide_food:form.canProvideFood,can_provide_carrier:form.canProvideCarrier,
        can_provide_records:form.canProvideRecords,understands_permanent:form.understandsPermanent,
        open_to_followup:form.openToFollowup
      })});
      let data={};try{data=await res.json();}catch{}
      if(res.ok&&data.success!==false){setSubmitted(true);}
      else{setError(data.message||`Error (${res.status}). Please try again.`);}
    }catch{setError("Network error. Please try again.");}
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#EDDABB",fontFamily:"'Nunito',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        @media(max-width:768px){.rehome-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Background */}
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",inset:0,background:"#EDDABB"}}/>
        <div style={{position:"absolute",width:900,height:900,top:"-20%",left:"-15%",borderRadius:"50%",background:"radial-gradient(circle,#B45A22,transparent 70%)",filter:"blur(120px)",opacity:0.38,animation:"fl1 9s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:800,height:800,bottom:"-15%",right:"-15%",borderRadius:"50%",background:"radial-gradient(circle,#588B41,transparent 70%)",filter:"blur(120px)",opacity:0.38,animation:"fl2 11s ease-in-out infinite"}}/>
      </div>

      <Navbar/>

      <div className="rehome-grid" style={{position:"relative",zIndex:10,maxWidth:1100,margin:"0 auto",padding:"4rem 2.5rem 6rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3rem",alignItems:"start"}}>
        {/* Left column */}
        <div>
          <Reveal>
            <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",borderRadius:50,padding:"0.3rem 1rem",fontSize:"0.67rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",fontStyle:"italic",marginBottom:"1rem",background:"rgba(180,90,34,0.10)",border:"1px solid rgba(180,90,34,0.28)",color:"#B45A22"}}>
              <i className="fas fa-home" style={{fontSize:"0.65rem"}}/> Rehoming Service
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,3.5vw,3rem)",fontWeight:900,color:"#1a4a08",lineHeight:1.1,marginBottom:"1rem"}}>Need to <em style={{fontStyle:"italic",color:"#B45A22"}}>Rehome</em> Your Pet?</h1>
            <p style={{fontSize:"0.95rem",fontWeight:700,color:"#3a5020",lineHeight:1.7,marginBottom:"2rem"}}>Life circumstances change. If you're unable to care for your pet, Pawster will help find them a safe, loving new home — with full discretion and care.</p>
          </Reveal>

          <Reveal delay={100}>
            <h3 style={{fontWeight:900,fontSize:"1rem",color:"#1a4a08",marginBottom:"1rem"}}>Common reasons families reach out:</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",marginBottom:"2.5rem"}}>
              {REASONS.map(({icon,label})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:"0.75rem",background:"rgba(255,248,225,0.75)",borderRadius:12,padding:"0.75rem 1rem",border:"1px solid rgba(180,140,60,0.28)"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"rgba(180,90,34,0.10)",color:"#B45A22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <i className={icon}/>
                  </div>
                  <span style={{fontWeight:700,fontSize:"0.88rem",color:"#3a5020"}}>{label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div style={{background:"linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))",border:"1px solid rgba(90,170,48,0.30)",borderRadius:18,padding:"1.5rem"}}>
              <div style={{fontWeight:900,fontSize:"0.95rem",color:"#1a4a08",marginBottom:"0.5rem"}}>🐾 Our Promise</div>
              <p style={{fontSize:"0.85rem",fontWeight:700,color:"#3a5020",lineHeight:1.7,margin:0}}>We never abandon animals. Every pet submitted through Pawster is screened, cared for, and matched only with verified, loving adopters.</p>
            </div>
          </Reveal>
        </div>

        {/* Right column — Form */}
        <Reveal delay={80}>
          <div style={{background:"rgba(255,248,225,0.85)",border:"1.5px solid rgba(255,238,190,0.6)",borderRadius:24,padding:"2rem",boxShadow:"0 8px 40px rgba(160,105,30,0.12)",position:"sticky",top:90}}>
            {submitted ? (
              <div style={{textAlign:"center",padding:"3rem 0"}}>
                <div style={{fontSize:"3.5rem",marginBottom:"1rem"}}>🏡</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:900,color:"#1a4a08",marginBottom:"0.5rem"}}>Thank You!</div>
                <p style={{fontSize:"0.9rem",fontWeight:700,color:"#3a5020",lineHeight:1.7}}>Your rehoming request has been received. Our team will contact you at your email within 24–48 hours.</p>
                <Link to="/home" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",marginTop:"1.5rem",padding:"0.75rem 1.75rem",borderRadius:12,fontWeight:900,fontSize:"0.9rem",color:"#fff",background:"#1c4f09",textDecoration:"none"}}>Back to Home</Link>
              </div>
            ) : (
              <>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",fontWeight:900,color:"#1a4a08",marginBottom:"0.3rem"}}>Rehome Request</h2>
                <p style={{fontSize:"0.8rem",fontWeight:700,color:"#6a7a50",marginBottom:"1.25rem"}}>Confidential · Step {step} of {STEPS.length} — {STEPS[step-1]}</p>

                {/* Step indicators */}
                <div style={{display:"flex",alignItems:"center",marginBottom:"1.5rem"}}>
                  {STEPS.map((label,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"none"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:900,flexShrink:0,transition:"all 0.2s",background:step>=i+1?"#B45A22":"rgba(180,140,60,0.20)",color:step>=i+1?"#fff":"#6a7a50"}}>
                        {step>i+1?<i className="fas fa-check" style={{fontSize:"0.65rem"}}/>:i+1}
                      </div>
                      {i<STEPS.length-1&&<div style={{flex:1,height:2,background:step>i+1?"#B45A22":"rgba(180,140,60,0.20)",borderRadius:1,transition:"all 0.3s",margin:"0 4px"}}/>}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{maxHeight:"52vh",overflowY:"auto",paddingRight:"0.25rem"}}>
                    <RehomeStepContent step={step} form={form} set={set} setV={setV}/>
                    {step === 4 && error && (
                      <div style={{padding:"0.625rem 0.875rem",borderRadius:10,background:"rgba(192,48,48,0.08)",border:"1px solid rgba(192,48,48,0.25)",fontSize:"0.82rem",fontWeight:700,color:"#c03030",marginTop:"0.75rem"}}>
                        <i className="fas fa-times-circle" style={{marginRight:"0.4rem"}}/>{error}
                      </div>
                    )}
                  </div>

                  <div style={{display:"flex",gap:"0.5rem",marginTop:"1.25rem"}}>
                    {step>1&&(
                      <button type="button" onClick={()=>{setError("");setStep(s=>s-1);}}
                        style={{flex:1,padding:"0.8rem",borderRadius:12,fontWeight:800,fontSize:"0.88rem",color:"#3a5020",background:"transparent",border:"1px solid rgba(180,140,60,0.28)",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
                        <i className="fas fa-arrow-left"/> Back
                      </button>
                    )}
                    {step<STEPS.length ? (
                      <button type="button" onClick={()=>{setError("");setStep(s=>s+1);}}
                        style={{flex:2,padding:"0.8rem",borderRadius:12,fontWeight:900,fontSize:"0.9rem",color:"#fff",background:"#B45A22",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 14px rgba(180,90,34,0.28)",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
                        Continue <i className="fas fa-arrow-right"/>
                      </button>
                    ) : (
                      <button type="submit" disabled={loading||!form.understandsPermanent}
                        style={{flex:2,padding:"0.8rem",borderRadius:12,fontWeight:900,fontSize:"0.9rem",color:"#fff",background:loading||!form.understandsPermanent?"#c08040":"#B45A22",border:"none",cursor:loading||!form.understandsPermanent?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 14px rgba(180,90,34,0.28)",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
                        {loading?<><i className="fas fa-spinner" style={{animation:"spin .8s linear infinite"}}/> Submitting…</>:<><i className="fas fa-paper-plane"/> Submit Request</>}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <img src={logo} alt="Pawster" className="w-8 h-8 object-contain mb-2" onError={e=>e.target.style.display="none"}/>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
          </div>
          {[
            {title:"Adopt",links:[["Browse Animals","/pets"],["My Profile","/profile"],["Log In","/login"],["Register","/register"]]},
            {title:"Services",links:[["How It Works","/how-it-works"],["Rehome a Pet","/rehome"],["Follow-Up Surveys","/followup-surveys"],["About Us","/about"]]},
            {title:"Regions",links:[["Ilocos Norte","/pets"],["Ilocos Sur","/pets"],["La Union","/pets"],["Pangasinan","/pets"]]}
          ].map(({title,links})=>(
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label,to])=><Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f","fab fa-instagram","fab fa-twitter"].map(icon=>(
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon}/>
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}