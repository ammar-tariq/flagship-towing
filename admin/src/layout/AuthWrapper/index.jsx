import { memo } from "react";
import { images } from "../../assets";

const AuthWrapper = ({ children, title = "Title", subtitle }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      <div
        className="hidden lg:flex lg:flex-1 h-auto lg:h-screen relative bg-cover bg-center bg-no-repeat min-h-[200px]"
        style={{ backgroundImage: `url(${images.auth})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#799AF9]/30 via-[#0D1DB9]/80 to-[#0D1DB9]/80" />
        <div className="relative flex flex-col justify-center items-center h-full w-full text-white p-8">
          <img src={images.whitelogo} alt="Flagship Towing" className="h-16 lg:h-22 max-w-[80%] object-contain" />
        </div>
      </div>
      <div className="flex-1 min-h-[100dvh] lg:h-screen bg-white lg:shadow-xl lg:rounded-2xl overflow-y-auto border-0 lg:border border-gray-200 flex flex-col items-center justify-center px-4 py-8 sm:px-8">
        <div className="lg:hidden mb-6 w-full max-w-md flex justify-center">
          <img src={images.logo} alt="Flagship Towing" className="h-10 object-contain" />
        </div>
        <div className="mb-4 w-full max-w-md">
          <h2 className="text-xl sm:text-2xl text-secondary font-medium">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default memo(AuthWrapper);
