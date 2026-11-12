from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class PasswordComplexityValidator:
    """
    Comprueba que la contraseña incluya mayúscula, minúscula,
    número y símbolo.

    La longitud mínima se configura mediante MinimumLengthValidator.
    """

    def validate(self, password, user=None):
        errors = []

        if not any(character.isupper() for character in password):
            errors.append(
                ValidationError(
                    _('La contraseña debe contener al menos una letra mayúscula.'),
                    code='password_no_uppercase',
                )
            )

        if not any(character.islower() for character in password):
            errors.append(
                ValidationError(
                    _('La contraseña debe contener al menos una letra minúscula.'),
                    code='password_no_lowercase',
                )
            )

        if not any(character.isdigit() for character in password):
            errors.append(
                ValidationError(
                    _('La contraseña debe contener al menos un número.'),
                    code='password_no_number',
                )
            )

        has_symbol = any(
            not character.isalnum() and not character.isspace()
            for character in password
        )

        if not has_symbol:
            errors.append(
                ValidationError(
                    _('La contraseña debe contener al menos un símbolo.'),
                    code='password_no_symbol',
                )
            )

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            'La contraseña debe tener al menos 12 caracteres e incluir '
            'una mayúscula, una minúscula, un número y un símbolo.'
        )