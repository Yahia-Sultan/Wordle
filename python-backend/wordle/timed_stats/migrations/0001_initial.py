# Generated by Django 4.0.3 on 2022-04-08 06:04

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Timed',
            fields=[
                ('timed_id', models.AutoField(primary_key=True, serialize=False)),
                ('word', models.TextField(max_length=11)),
                ('word_length', models.IntegerField(max_length=11)),
                ('attempts', models.IntegerField(max_length=11)),
                ('win', models.BooleanField(default=False)),
                ('difficulty', models.TextField(max_length=100)),
            ],
        ),
    ]
