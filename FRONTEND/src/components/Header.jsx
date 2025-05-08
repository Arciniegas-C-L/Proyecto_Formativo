import { Link } from "react-router-dom"

export function Header() {
    return (
        <div className="d-flex justify-content-between p-3 bg-dark mb-2">
            <div>
                <Link to="/home" className="text-dark text-decoration-none text-md text-white "><h3>Variedad y  Estilos ZOE</h3></Link>
            </div>
            <div>
                <ul className="nav">
                    <li className="nav-item">
                        <Link to="/rol" className="text-dark text-decoration-none nav-link text-white">Rol</Link>
                    </li>
                </ul>
            </div>
        </div>
    )
}
