# Generated by Django 4.0.3 on 2022-04-26 20:29

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('daily_stats', '0003_daily_user'),
        ('blitz_stats', '0003_rename_blitzs_id_blitz_blitz_id_blitz_user'),
        ('timed_stats', '0003_timed_user'),
        ('unlimited_stats', '0003_unlimited_user'),
        ('user', '0003_user_user_name'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='User',
            new_name='Users',
        ),
    ]
