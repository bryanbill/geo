import { useSearch } from "../context/search-context";
import type React from "react";


const ResultList: React.FC = () => {
  const { results} = useSearch();
  if (results?.length === 0) {
    return (
      <div className="p-4 w-full h-full flex-col flex items-center justify-center">
        <p className="text-gray-500 p-4 text-center  rounded-md">
          Ask me anything...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 px-4">
      {results?.map((result) => (
        <div key={result.id} className="p-4 border rounded-md  mb-2">

          <h3 className="text-lg font-semibold">{result.name}</h3>
       
          <span className="text-sm text-primary">{result.category}</span>
        </div>
      ))}
    </div>
  );
};

export default ResultList;
