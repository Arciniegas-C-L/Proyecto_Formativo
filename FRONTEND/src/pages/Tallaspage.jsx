import {Tallas} from "../components/Tallas/Tallas.jsx";

export const TallasPage = () => {
  return (
    <div className="container mt-4">
      <h1>Tallas Page</h1>
      <Tallas />
      <p>This is the Tallas page where you can manage sizes.</p>
      {/* Here you can include the Tallas component */}
      {/* <Tallas /> */}
    </div>
  );
}