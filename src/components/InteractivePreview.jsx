import { useState } from 'react';
import { FaList, FaArrowLeft } from 'react-icons/fa';

// Componente para el mensaje inicial (botón o lista)
const InitialMessage = ({ type, body, options, listButtonText, onListOpen }) => (
    <div className="w-full max-w-[320px] bg-white p-2 rounded-lg shadow-md border border-gray-200">
        <div className="bg-[#E1F7CB] p-3 rounded-lg">
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{body}</p>
        </div>
        <div className="mt-2 space-y-1">
            {type === 'button' ? (
                options.map(btn => (
                    <div key={btn.id} className="bg-white text-center text-blue-600 p-2 rounded-lg text-sm border border-gray-200 shadow-sm">
                        {btn.title}
                    </div>
                ))
            ) : (
                <button 
                    onClick={onListOpen}
                    className="w-full bg-white text-center text-blue-600 p-2 rounded-lg text-sm border border-gray-200 shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                    <FaList /> {listButtonText}
                </button>
            )}
        </div>
    </div>
);

// Componente para la vista de la lista (simulando una nueva pantalla)
const ListView = ({ header, options, onClose }) => (
    <div className="w-full max-w-[320px] h-[500px] bg-gray-100 rounded-lg shadow-md border border-gray-200 flex flex-col">
        <header className="bg-green-700 text-white p-3 flex items-center gap-4">
            <button onClick={onClose} className="hover:opacity-75"><FaArrowLeft /></button>
            <h3 className="font-semibold">{header}</h3>
        </header>
        <div className="p-2 overflow-y-auto">
            <h4 className="text-xs font-semibold text-gray-600 p-2 uppercase">Nuestros Servicios</h4>
            <ul className="bg-white rounded-lg">
                {options.map((opt, index) => (
                    <li key={opt.id} className={`p-3 text-sm text-gray-800 ${index < options.length - 1 ? 'border-b' : ''}`}>
                        {opt.title}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


export default function InteractivePreview({ type, header, body, options, listButtonText }) {
    const [isListVisible, setListVisible] = useState(false);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {isListVisible ? (
                <ListView 
                    header={header}
                    options={options}
                    onClose={() => setListVisible(false)}
                />
            ) : (
                <InitialMessage 
                    type={type}
                    body={body}
                    options={options}
                    listButtonText={listButtonText}
                    onListOpen={() => setListVisible(true)}
                />
            )}
        </div>
    );
}