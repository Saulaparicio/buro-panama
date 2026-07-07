'use client';

import { useState, type FC, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Cancel01Icon,
  Folder01Icon,
  TaskEdit01Icon,
  NoteIcon,
  Award01Icon,
} from '@hugeicons/core-free-icons';
import { motion, AnimatePresence } from 'motion/react';

export interface DisclosureItem {
  icon: ReactNode;
  label: string;
  path: string;
}

export interface CreateNewDisclosureProps {
  items?: DisclosureItem[];
  initialOpen?: boolean;
  onClose?: () => void;
}

interface GridItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  onClick: () => void;
}

const GridItem: FC<GridItemProps> = ({ icon, label, path, onClick }) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1 sm:gap-1.5 rounded-[20px] sm:rounded-[24px] px-1 py-3 sm:py-4 transition-all duration-200 hover:bg-[#F4F2EA] dark:hover:bg-neutral-800/50"
    >
      <div className="text-[#8B8B8B] transition-colors group-hover:text-[#4A4A4A] dark:text-neutral-500 dark:group-hover:text-neutral-300 [&>svg]:size-5 sm:[&>svg]:size-7">
        {icon}
      </div>
      <span className="text-[12px] sm:text-[14px] font-bold tracking-tight text-[#4A4A4A] dark:text-neutral-400">
        {label}
      </span>
    </Link>
  );
};

export const CreateNewDisclosure: FC<CreateNewDisclosureProps> = ({
  items,
  initialOpen = false,
  onClose,
}) => {
  const [open, setOpen] = useState<boolean>(initialOpen);

  const defaultItems: DisclosureItem[] = [
    {
      icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={1.5} />,
      label: 'Reserva',
      path: '/admin/reservations',
    },
    {
      icon: <HugeiconsIcon icon={TaskEdit01Icon} strokeWidth={1.5} />,
      label: 'Cotización',
      path: '/admin/quotes',
    },
    {
      icon: <HugeiconsIcon icon={NoteIcon} strokeWidth={1.5} />,
      label: 'Evento',
      path: '/admin/events',
    },
    {
      icon: <HugeiconsIcon icon={Award01Icon} strokeWidth={1.5} />,
      label: 'Cliente',
      path: '/admin/add-member',
    },
  ];

  const disclosureItems = items || defaultItems;

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 bg-[#10b981] hover:bg-[#059669] px-6 py-3.5 sm:px-8 sm:py-4 text-base sm:text-lg font-medium whitespace-nowrap text-white dark:bg-neutral-900 border-none rounded-full shadow-lg"
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Add01Icon}
            size={24}
            className="text-white dark:text-neutral-400 sm:size-[26px]"
            strokeWidth={1.5}
          />
          Crear Nuevo
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
              style={{
                borderRadius: 22,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-80 bg-[#F7F5EE] p-1 dark:bg-neutral-900 shadow-2xl border border-slate-200/20"
            >
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-[15px] sm:text-[16px] font-semibold text-[#5C5A56] dark:text-neutral-400">
                  Crear Nuevo
                </p>
                <button
                  onClick={handleClose}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#B8B5B0] dark:bg-neutral-700 border-none"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    color="#ffffff"
                    strokeWidth={2.5}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-t-[20px] rounded-b-[20px] bg-white p-3 sm:p-4 shadow-sm dark:bg-neutral-950">
                {disclosureItems.map((item, index) => (
                  <GridItem key={index} icon={item.icon} label={item.label} path={item.path} onClick={handleClose} />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
