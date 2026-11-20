import { Dispatch, SetStateAction, useCallback, useState } from 'react';

const useToggle = (
  initial?: boolean,
): [boolean, Dispatch<SetStateAction<boolean>>, () => void] => {
  const [openModal, setOpenModal] = useState<boolean>(initial || false);

  const toggleModal = useCallback(() => {
    setOpenModal((prev) => !prev);
  }, [openModal]);

  return [openModal, setOpenModal, toggleModal];
};

export default useToggle;
