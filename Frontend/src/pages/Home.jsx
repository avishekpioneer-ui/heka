import React, { useEffect, useState } from 'react';
import Services from '../components/Services';
import AllServices from '../components/AllServices';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Slider from '../components/Slider';
import PartnerShip from '../components/PartnerShip';
import CategoriesCard from '../components/CategoriesCard';
import WhatsNew from '../components/WhatsNew';
import JoinUs from '../components/JoinUs';
import Preloader from '../components/Preloader';

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("hasSeenPreloader");
    if (alreadySeen) {
      setLoading(false);
    }
  }, []);

  return (
    <>
      {loading && (
        <Preloader
          message="HEKA - care that cares"
          onComplete={() => setLoading(false)}
        />
      )}

      {!loading && (
        <div className='bg-[#E3E3E3] flex flex-col gap-6'>
          <Navbar />
          <div className='px-3 space-y-8'>
            <CategoriesCard />
            <AllServices />
            <PartnerShip />
            <Slider />
            <WhatsNew />
            <JoinUs />
          </div>
          <Footer />
        </div>
      )}
    </>
  );
};

export default Home;
