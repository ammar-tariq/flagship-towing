import AppWrapper from '@Components/Wrapper/AppWrapper';
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper';
import {font, heightPixel} from '@Utils/helpers';
import React, {FC} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import AppText from '@Components/AppText';
import Button from '@Components/Button';
import {GeneralScreenProps} from '@Types/navigation';
import {navigate} from '@Utils/navigation';
import {colors} from '@Utils/color';
import {useAuthMode} from '@Hooks/useAuthMode';
import CachedImage from '@Components/CachedImage';

const MembershipDetailScreen: FC<GeneralScreenProps<'MembershipDetail'>> = ({
  route,
}) => {
  const {item} = route.params;
  const {isUser, requireAuth, signOut} = useAuthMode();
  const handleBuy = () => {
    requireAuth(() => {
      navigate('AddVessel', {id: item?.prices[0]?.id});
    });
  };

  const handleLogin = () => {
    signOut();
  };

  const renderLoginCta = () => (
    <View>
      <TouchableOpacity
        onPress={handleLogin}
        style={{
          alignSelf: 'center',
        }}>
        <AppText
          style={{
            color: colors.primary,
            fontSize: font(16),
            textDecorationLine: 'underline',
          }}>
          Login to continue
        </AppText>
      </TouchableOpacity>
    </View>
  );

  const renderButton = () => {
    // Guest mode is still "logged in" for nav — require a real user to add a vessel
    if (!isUser) {
      return renderLoginCta();
    }

    return <Button text="Next" onPress={handleBuy} />;
  };

  return (
    <AppWrapper scroll edges={['bottom']} style={{paddingTop: heightPixel(15)}}>
      <WhiteWrapper>
        <CachedImage source={item?.images?.[0]} style={styles.image_style} />
        <View>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <AppText weight="semibold" style={[styles.header_text, {fontSize: font(16)}]}>
              {item?.name}
            </AppText>
            <View>
              <AppText weight="bold">
                ${item?.prices[0]?.unit_amount / 100}/
              </AppText>
              <AppText style={{fontSize: font(8)}}>Per {item?.prices[0]?.recurring?.interval}</AppText>
            </View>
          </View>
        </View>

        <AppText style={[{fontSize: font(12)}, {lineHeight: heightPixel(22)}]}>
          {item?.description}
        </AppText>
      </WhiteWrapper>
      {renderButton()}
    </AppWrapper>
  );
};

export default MembershipDetailScreen;
