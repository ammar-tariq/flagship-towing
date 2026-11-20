import {images} from '@Assets/Images';
import React, {FC} from 'react';
import {ImageBackground, Modal, StyleSheet} from 'react-native';

interface SplashOverlayProps {
  visible?: boolean;
}

const SplashOverlay: FC<SplashOverlayProps> = ({visible = true}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <ImageBackground
        source={images.main.splash}
        style={styles.container}
        resizeMode="cover"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SplashOverlay;
