import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_securityauditlog'),
    ]

    operations = [
        migrations.AddField(
            model_name='teammember',
            name='allocation_percentage',
            field=models.PositiveSmallIntegerField(
                default=0,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(100),
                ],
                verbose_name='DedicaciÃ³n al Proyecto (%)',
            ),
        ),
        migrations.AddField(
            model_name='teammember',
            name='availability',
            field=models.PositiveSmallIntegerField(
                default=100,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(100),
                ],
                verbose_name='Disponibilidad (%)',
            ),
        ),
        migrations.AddField(
            model_name='teammember',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddConstraint(
            model_name='teammember',
            constraint=models.CheckConstraint(
                condition=models.Q(availability__gte=0, availability__lte=100),
                name='team_member_availability_0_100',
            ),
        ),
        migrations.AddConstraint(
            model_name='teammember',
            constraint=models.CheckConstraint(
                condition=models.Q(
                    allocation_percentage__gte=0,
                    allocation_percentage__lte=100,
                ),
                name='team_member_allocation_0_100',
            ),
        ),
    ]
