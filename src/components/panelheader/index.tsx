import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import  { auth } from "../../services/firebaseConnection"
import '../../../styles.css'

export function DashboardHeader(){

    async function handleLogout(){
        await  signOut(auth)
    }

    return(

        <div className="w-full items-center flex h-10 bg-red-500 rounded-lg text-white font-medium gap-4 px-4 mb-4">
            <Link className={location.pathname === '/' ? 'active-link' : 'hover:text-red-900 '} to='/'>
                Home
            </Link>

            <p>|</p>

            <Link className={location.pathname === '/dashboard' ? 'active-link' : 'hover:text-red-900 '} to='/dashboard'>
                Dashboard
            </Link>

            <p>|</p>

            <Link className={location.pathname === '/dashboard/new' ? 'active-link' : 'hover:text-red-900 '} to='/dashboard/new'>
                Novo Carro
            </Link>

            <button className="ml-auto hover:text-red-900" onClick={handleLogout}>
                Sair da conta
            </button>

        </div>
    )
}