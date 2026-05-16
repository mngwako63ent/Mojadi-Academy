import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Leaf, Target, History, Award, ArrowDown } from 'lucide-react';

const About = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  return (
    <div className="flex flex-col">
      {/* Hero / Story Section with Cinematic Background */}
      <section className="relative min-h-[600px] md:min-h-screen flex items-start md:items-center overflow-hidden pt-28 md:pt-32 pb-20">
        {/* Cinematic Background Layer */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 z-0"
        >
          {/* Advanced Atmospheric Blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent dark:from-slate-950 z-10 h-64" />
          
          {/* Radial depth mask for center focus */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />

          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop"
            alt="Agricultural landscape"
            className="w-full h-full object-cover scale-110"
            style={{ 
              maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
            }}
            referrerPolicy="no-referrer"
          />
          
          {/* Atmospheric Depth Mask */}
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] z-10" />
          
          {/* Soft Bottom Transition */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary to-transparent z-10" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 relative z-20 w-full mb-12">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 space-y-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-secondary" />
                <span className="text-secondary font-bold uppercase tracking-[0.3em] text-xs">Our Story & Legacy</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] text-white">
                Cultivating Knowledge for a <span className="text-secondary italic">Sustainable</span> Future
              </h1>
              
              <div className="grid md:grid-cols-2 gap-10 pt-4">
                <div className="space-y-6">
                  <p className="text-xl text-white/80 leading-relaxed font-medium">
                    Established in 2025, Mojadi Farm Holding Academy empowers emerging farmers through high-quality agricultural education.
                  </p>
                  <p className="text-lg text-white/60 leading-relaxed">
                    We bridge the gap between classroom theory and real-world farm production using structured digital content and active production site demonstrations.
                  </p>
                </div>

                <div className="flex flex-col gap-8 pt-2">
                  <div className="space-y-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary">
                        <Target size={20} />
                      </div>
                      <h4 className="font-bold text-white text-lg">Our Mission</h4>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      To empower emerging and upcoming farmers across South-Africa with world-class agricultural education.
                    </p>
                  </div>
                  <div className="space-y-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                        <History size={20} />
                      </div>
                      <h4 className="font-bold text-white text-lg">Our Goal</h4>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Deliver essential knowledge through structured digital content that transforms the local agricultural sector.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* Values Section - Seamless Blend via Dark Background */}
      <section className="bg-primary pb-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative -top-20 z-30 bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-20 shadow-2xl flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <div className="space-y-2">
                <span className="text-secondary font-bold uppercase tracking-widest text-sm italic">Practical Implementation</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">Where Theory Meets the Soil</h2>
              </div>
              <p className="text-primary/70 dark:text-sage leading-relaxed text-lg lg:text-xl">
                What sets us apart is our direct connection to active production facilities, enabling us to provide practical demonstrations of concepts in real-time. 
              </p>
              <div className="flex items-center gap-6 p-6 bg-black/5 rounded-2xl border-l-4 border-secondary">
                <p className="text-sm font-medium italic text-primary/60">
                  "Our goal is to ensure that no farmer is left behind in the digital transformation of agriculture."
                </p>
              </div>
            </div>
            <div className="lg:w-1/2 w-full relative group">
              <div className="absolute -inset-4 bg-secondary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
                <img 
                  src="https://images.unsplash.com/photo-1686008673889-1817ec20e302?q=80&w=1200" 
                  alt="Practical demonstration" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <div className="text-center space-y-20 pt-24">
            <div className="space-y-4">
              <span className="text-secondary font-bold uppercase tracking-[0.2em] text-sm">Core Values</span>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white">What Drives Us</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Integrity', desc: 'We provide honest, scientifically-backed information that farmers can trust.', icon: Award },
                { title: 'Sustainability', desc: 'Every lesson is designed with the long-term health of our planet in mind.', icon: Leaf },
                { title: 'Community', desc: 'We foster a global network of farmers who learn and grow together.', icon: Target },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="group relative p-12 bg-white/5 hover:bg-white/10 rounded-[3rem] border border-white/10 transition-all text-center space-y-8 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 bg-secondary text-white rounded-[1.5rem] flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-2xl shadow-secondary/30 relative z-10 font-bold">
                    <v.icon size={40} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl lg:text-3xl font-display font-bold text-white">{v.title}</h3>
                    <p className="text-white/60 leading-relaxed font-medium text-lg">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
