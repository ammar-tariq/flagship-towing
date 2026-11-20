import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../../Loader";

const DetailsPage = ({ title, children, loading = false }) => {
  const navigate = useNavigate();

  const goBack = () => navigate(-1);

  return (
    <div className="mx-auto w-full max-w-full">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 min-w-0">
        <button
          type="button"
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate">{title}</h1>
      </div>
      {loading ? <Loader center size={48} /> : children}
    </div>
  );
};

export default DetailsPage;
